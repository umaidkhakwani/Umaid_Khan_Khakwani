import { query } from '../../config/database';
import { User } from '../../domain/entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(row.id, row.email, new Date(row.created_at), new Date(row.updated_at));
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      `SELECT id, email, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User(row.id, row.email, new Date(row.created_at), new Date(row.updated_at));
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, created_at, updated_at)
       VALUES ($1, NOW(), NOW())
       RETURNING id, email, created_at, updated_at`,
      [user.email]
    );

    const row = result.rows[0];
    return new User(row.id, row.email, new Date(row.created_at), new Date(row.updated_at));
  }
}

