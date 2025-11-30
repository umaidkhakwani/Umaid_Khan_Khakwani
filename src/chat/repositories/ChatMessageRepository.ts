import { query } from '../../config/database';
import { ChatMessage } from '../../domain/entities/ChatMessage';

export interface IChatMessageRepository {
  create(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
  findByUserId(userId: string, limit?: number): Promise<ChatMessage[]>;
  findById(id: string): Promise<ChatMessage | null>;
}

export class ChatMessageRepository implements IChatMessageRepository {
  async create(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const result = await query(
      `INSERT INTO chat_messages (user_id, question, answer, tokens, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, user_id, question, answer, tokens, created_at`,
      [message.userId, message.question, message.answer, message.tokens]
    );

    const row = result.rows[0];
    return new ChatMessage(
      row.id,
      row.user_id,
      row.question,
      row.answer,
      row.tokens,
      row.created_at
    );
  }

  async findByUserId(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    const result = await query(
      `SELECT id, user_id, question, answer, tokens, created_at
       FROM chat_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(
      (row) =>
        new ChatMessage(row.id, row.user_id, row.question, row.answer, row.tokens, row.created_at)
    );
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const result = await query(
      `SELECT id, user_id, question, answer, tokens, created_at
       FROM chat_messages
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new ChatMessage(
      row.id,
      row.user_id,
      row.question,
      row.answer,
      row.tokens,
      row.created_at
    );
  }
}

