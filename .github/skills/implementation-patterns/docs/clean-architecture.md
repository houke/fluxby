# Clean Architecture Guide

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│              (React Components, Controllers)                 │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│              (Use Cases, Services, DTOs)                     │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│           (Entities, Value Objects, Interfaces)              │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                       │
│        (Repositories, External Services, Database)           │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Rule

**Dependencies point inward.** Inner layers know nothing about outer layers.

```
Presentation → Application → Domain ← Infrastructure
```

## Layer Responsibilities

### Domain Layer (Core)

Contains business logic, independent of frameworks.

```typescript
// Entity
class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    private _name: string,
    private _role: UserRole,
  ) {}

  get name(): string {
    return this._name;
  }

  rename(newName: string): void {
    if (newName.length < 2) {
      throw new ValidationError('Name must be at least 2 characters');
    }
    this._name = newName;
  }

  promote(): void {
    if (this._role === UserRole.Admin) {
      throw new DomainError('User is already an admin');
    }
    this._role = UserRole.Admin;
  }
}

// Value Object
class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    if (!value.includes('@')) {
      throw new ValidationError('Invalid email format');
    }
    return new Email(value.toLowerCase());
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

// Repository Interface (Port)
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
```

### Application Layer

Orchestrates use cases, contains application-specific logic.

```typescript
// Use Case
class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private eventBus: EventBus,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // Validate uniqueness
    const existing = await this.userRepository.findByEmail(
      Email.create(input.email),
    );
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Create user
    const user = new User(
      UserId.generate(),
      Email.create(input.email),
      input.name,
      UserRole.Member,
    );

    // Persist
    await this.userRepository.save(user);

    // Side effects
    await this.emailService.sendWelcome(user.email);
    await this.eventBus.publish(new UserCreatedEvent(user.id));

    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
    };
  }
}

// Input DTO
interface CreateUserInput {
  email: string;
  name: string;
}

// Output DTO
interface CreateUserOutput {
  id: string;
  email: string;
  name: string;
}
```

### Infrastructure Layer

Implements interfaces defined in domain layer.

```typescript
// Repository Implementation
class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id: id.value },
    });

    return data ? this.toDomain(data) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: this.toPersistence(user),
      update: this.toPersistence(user),
    });
  }

  private toDomain(data: UserRecord): User {
    return new User(
      new UserId(data.id),
      Email.create(data.email),
      data.name,
      data.role as UserRole,
    );
  }

  private toPersistence(user: User): UserRecord {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      role: user.role,
    };
  }
}
```

### Presentation Layer

Handles HTTP, CLI, or UI concerns.

```typescript
// Controller
class UserController {
  constructor(private createUser: CreateUserUseCase) {}

  async create(req: Request, res: Response): Promise<void> {
    const input: CreateUserInput = {
      email: req.body.email,
      name: req.body.name,
    };

    const output = await this.createUser.execute(input);

    res.status(201).json(output);
  }
}

// React Component
function CreateUserForm() {
  const createUser = useCreateUser(); // Hook wrapping use case

  const handleSubmit = async (data: FormData) => {
    const result = await createUser.execute({
      email: data.email,
      name: data.name,
    });

    if (result.ok) {
      navigate(`/users/${result.value.id}`);
    }
  };

  return <Form onSubmit={handleSubmit}>...</Form>;
}
```

## Dependency Injection

```typescript
// Composition Root
function createContainer() {
  const prisma = new PrismaClient();
  const eventBus = new EventBus();

  // Repositories
  const userRepository = new PrismaUserRepository(prisma);

  // Services
  const emailService = new SendGridEmailService();

  // Use Cases
  const createUser = new CreateUserUseCase(
    userRepository,
    emailService,
    eventBus,
  );

  // Controllers
  const userController = new UserController(createUser);

  return { userController };
}
```

## Directory Structure

```
src/
├── domain/
│   ├── entities/
│   │   └── User.ts
│   ├── value-objects/
│   │   ├── UserId.ts
│   │   └── Email.ts
│   ├── repositories/
│   │   └── UserRepository.ts
│   └── events/
│       └── UserCreatedEvent.ts
├── application/
│   ├── use-cases/
│   │   ├── CreateUser.ts
│   │   └── GetUser.ts
│   ├── dtos/
│   │   └── UserDTO.ts
│   └── services/
│       └── EmailService.ts
├── infrastructure/
│   ├── repositories/
│   │   └── PrismaUserRepository.ts
│   ├── services/
│   │   └── SendGridEmailService.ts
│   └── database/
│       └── prisma.ts
└── presentation/
    ├── http/
    │   ├── controllers/
    │   │   └── UserController.ts
    │   └── routes/
    │       └── users.ts
    └── react/
        ├── components/
        └── hooks/
```

## Benefits

1. **Testability**: Domain logic tested without infrastructure
2. **Flexibility**: Swap implementations without changing business logic
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Easy to add new features in isolation

## Testing Each Layer

```typescript
// Domain - Unit tests
describe('User', () => {
  it('should rename user', () => {
    const user = new User(UserId.generate(), Email.create('test@example.com'), 'Alice', UserRole.Member);
    user.rename('Bob');
    expect(user.name).toBe('Bob');
  });
});

// Application - Unit tests with mocks
describe('CreateUserUseCase', () => {
  it('should create user', async () => {
    const mockRepo = { save: vi.fn(), findByEmail: vi.fn().mockResolvedValue(null) };
    const useCase = new CreateUserUseCase(mockRepo, mockEmailService, mockEventBus);

    const result = await useCase.execute({ email: 'test@example.com', name: 'Alice' });

    expect(mockRepo.save).toHaveBeenCalled();
  });
});

// Infrastructure - Integration tests
describe('PrismaUserRepository', () => {
  it('should persist and retrieve user', async () => {
    const repo = new PrismaUserRepository(prisma);
    const user = new User(...);

    await repo.save(user);
    const found = await repo.findById(user.id);

    expect(found?.email).toEqual(user.email);
  });
});
```
