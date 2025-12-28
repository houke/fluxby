import { Router } from 'express';
import { queryOne, run } from '../db/index.js';

interface DBUser {
  id: number;
  name: string;
  avatar: string | null;
  created_at: string;
}

const router = Router();

function mapUser(row: DBUser | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
}

// Ensure a default user exists before handling requests
function ensureDefaultUser(): void {
  run(
    "INSERT OR IGNORE INTO users (id, name, avatar) VALUES (1, 'Gebruiker', 'linear-gradient(135deg, #6366F1, #A855F7)')"
  );
}

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Gebruikersprofiel
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Haal het gebruikersprofiel op
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Het huidige profiel
 */
router.get('/', (req, res) => {
  try {
    ensureDefaultUser();
    const user = queryOne<DBUser>('SELECT * FROM users WHERE id = 1');
    res.json({ success: true, data: mapUser(user) });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res
      .status(500)
      .json({ success: false, error: 'Kon gebruikersprofiel niet ophalen' });
  }
});

/**
 * @swagger
 * /api/user:
 *   patch:
 *     summary: Werk het gebruikersprofiel bij
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Het bijgewerkte profiel
 */
router.patch('/', (req, res) => {
  try {
    ensureDefaultUser();
    const { name, avatar } = req.body as {
      name?: string;
      avatar?: string | null;
    };

    if (
      (name === undefined || name === null || name.toString().trim() === '') &&
      (avatar === undefined || avatar === null)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Geef een naam of avatar om bij te werken',
      });
    }

    const trimmedName =
      typeof name === 'string' ? name.trim().slice(0, 100) : undefined;
    const avatarString =
      typeof avatar === 'string' ? avatar.trim().slice(0, 400) : avatar;

    if (avatarString && avatarString.toLowerCase().includes('url(')) {
      return res.status(400).json({
        success: false,
        error: 'Avatar-formaat niet toegestaan',
      });
    }

    run(
      'UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = 1',
      [trimmedName ?? null, avatarString ?? null]
    );

    const updated = queryOne<DBUser>('SELECT * FROM users WHERE id = 1');
    res.json({ success: true, data: mapUser(updated) });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res
      .status(500)
      .json({ success: false, error: 'Kon gebruikersprofiel niet bijwerken' });
  }
});

export default router;
