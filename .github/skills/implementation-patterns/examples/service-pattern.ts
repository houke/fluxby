/**
 * Service Layer Pattern
 *
 * Encapsulating business logic in service classes.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

import type { Result } from './result-pattern';
import { Ok, Err, tryCatch } from './result-pattern';

// Domain types
interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

interface UpdateUserDTO {
  name?: string;
  email?: string;
}

// Error types
type UserError =
  | { type: 'NOT_FOUND'; userId: string }
  | { type: 'EMAIL_EXISTS'; email: string }
  | { type: 'VALIDATION'; field: string; message: string }
  | { type: 'UNAUTHORIZED' }
  | { type: 'INTERNAL'; message: string };

// Repository interface
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options: { limit: number; offset: number }): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// External service interfaces
interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

interface EmailService {
  sendWelcome(email: string, name: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
}

interface EventBus {
  publish<T>(event: string, payload: T): Promise<void>;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly eventBus: EventBus,
  ) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  async createUser(dto: CreateUserDTO): Promise<Result<User, UserError>> {
    // Validate input
    const validation = this.validateCreateInput(dto);
    if (!validation.ok) return validation;

    // Check for existing email
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      return Err({ type: 'EMAIL_EXISTS', email: dto.email });
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // Create user
    const userResult = await tryCatch(
      this.userRepo.create({
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        role: 'user',
      }),
    );

    if (!userResult.ok) {
      return Err({ type: 'INTERNAL', message: 'Failed to create user' });
    }

    const user = userResult.value;

    // Side effects (fire and forget)
    this.emailService.sendWelcome(user.email, user.name).catch(console.error);
    this.eventBus
      .publish('user.created', { userId: user.id })
      .catch(console.error);

    return Ok(user);
  }

  private validateCreateInput(dto: CreateUserDTO): Result<void, UserError> {
    if (!dto.email.includes('@')) {
      return Err({
        type: 'VALIDATION',
        field: 'email',
        message: 'Invalid email format',
      });
    }
    if (dto.name.length < 2) {
      return Err({
        type: 'VALIDATION',
        field: 'name',
        message: 'Name must be at least 2 characters',
      });
    }
    if (dto.password.length < 8) {
      return Err({
        type: 'VALIDATION',
        field: 'password',
        message: 'Password must be at least 8 characters',
      });
    }
    return Ok(undefined);
  }

  // ============================================================================
  // READ
  // ============================================================================

  async getUserById(id: string): Promise<Result<User, UserError>> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      return Err({ type: 'NOT_FOUND', userId: id });
    }

    return Ok(user);
  }

  async getUserByEmail(email: string): Promise<Result<User, UserError>> {
    const user = await this.userRepo.findByEmail(email.toLowerCase());

    if (!user) {
      return Err({ type: 'NOT_FOUND', userId: email });
    }

    return Ok(user);
  }

  async listUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<Result<User[], UserError>> {
    const offset = (page - 1) * limit;

    const usersResult = await tryCatch(
      this.userRepo.findAll({ limit, offset }),
    );

    if (!usersResult.ok) {
      return Err({ type: 'INTERNAL', message: 'Failed to fetch users' });
    }

    return Ok(usersResult.value);
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async updateUser(
    id: string,
    dto: UpdateUserDTO,
    requesterId: string,
  ): Promise<Result<User, UserError>> {
    // Check authorization
    const authResult = await this.authorizeUpdate(id, requesterId);
    if (!authResult.ok) return authResult;

    // Validate input
    if (dto.email && !dto.email.includes('@')) {
      return Err({
        type: 'VALIDATION',
        field: 'email',
        message: 'Invalid email format',
      });
    }

    // Check email uniqueness if changing
    if (dto.email) {
      const existing = await this.userRepo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        return Err({ type: 'EMAIL_EXISTS', email: dto.email });
      }
    }

    // Update user
    const updated = await this.userRepo.update(id, {
      ...dto,
      email: dto.email?.toLowerCase(),
    });

    if (!updated) {
      return Err({ type: 'NOT_FOUND', userId: id });
    }

    // Publish event
    await this.eventBus.publish('user.updated', { userId: id, changes: dto });

    return Ok(updated);
  }

  private async authorizeUpdate(
    targetId: string,
    requesterId: string,
  ): Promise<Result<void, UserError>> {
    // Users can update themselves
    if (targetId === requesterId) {
      return Ok(undefined);
    }

    // Admins can update anyone
    const requester = await this.userRepo.findById(requesterId);
    if (requester?.role === 'admin') {
      return Ok(undefined);
    }

    return Err({ type: 'UNAUTHORIZED' });
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async deleteUser(
    id: string,
    requesterId: string,
  ): Promise<Result<void, UserError>> {
    // Only admins can delete users
    const requester = await this.userRepo.findById(requesterId);
    if (requester?.role !== 'admin') {
      return Err({ type: 'UNAUTHORIZED' });
    }

    // Cannot delete self
    if (id === requesterId) {
      return Err({
        type: 'VALIDATION',
        field: 'id',
        message: 'Cannot delete yourself',
      });
    }

    const deleted = await this.userRepo.delete(id);

    if (!deleted) {
      return Err({ type: 'NOT_FOUND', userId: id });
    }

    // Publish event
    await this.eventBus.publish('user.deleted', { userId: id });

    return Ok(undefined);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async authenticate(
    email: string,
    password: string,
  ): Promise<Result<User, UserError>> {
    const user = await this.userRepo.findByEmail(email.toLowerCase());

    if (!user) {
      // Same error as wrong password to prevent enumeration
      return Err({ type: 'UNAUTHORIZED' });
    }

    const valid = await this.passwordService.verify(
      password,
      user.passwordHash,
    );

    if (!valid) {
      return Err({ type: 'UNAUTHORIZED' });
    }

    return Ok(user);
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createUserService(deps: {
  userRepo: UserRepository;
  passwordService: PasswordService;
  emailService: EmailService;
  eventBus: EventBus;
}): UserService {
  return new UserService(
    deps.userRepo,
    deps.passwordService,
    deps.emailService,
    deps.eventBus,
  );
}
