import { query } from '../../config/database';
import { MonthlyUsage } from '../../domain/entities/MonthlyUsage';

export interface IMonthlyUsageRepository {
  findByUserIdAndMonth(userId: string, year: number, month: number): Promise<MonthlyUsage | null>;
  create(usage: {
    userId: string;
    year: number;
    month: number;
    messageCount: number;
  }): Promise<MonthlyUsage>;
  update(usage: MonthlyUsage): Promise<MonthlyUsage>;
  findForAutoReset(): Promise<MonthlyUsage[]>;
}

export class MonthlyUsageRepository implements IMonthlyUsageRepository {
  async findByUserIdAndMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyUsage | null> {
    const result = await query(
      `SELECT id, user_id, year, month, message_count, last_reset_date, created_at, updated_at
       FROM monthly_usage
       WHERE user_id = $1 AND year = $2 AND month = $3`,
      [userId, year, month]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new MonthlyUsage(
      row.id,
      row.user_id,
      row.year,
      row.month,
      row.message_count,
      new Date(row.last_reset_date),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async create(
    usage: {
      userId: string;
      year: number;
      month: number;
      messageCount: number;
    }
  ): Promise<MonthlyUsage> {
    const result = await query(
      `INSERT INTO monthly_usage (user_id, year, month, message_count, last_reset_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
       RETURNING id, user_id, year, month, message_count, last_reset_date, created_at, updated_at`,
      [usage.userId, usage.year, usage.month, usage.messageCount]
    );

    const row = result.rows[0];
    return new MonthlyUsage(
      row.id,
      row.user_id,
      row.year,
      row.month,
      row.message_count,
      new Date(row.last_reset_date),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async update(usage: MonthlyUsage): Promise<MonthlyUsage> {
    await query(
      `UPDATE monthly_usage
       SET message_count = $1, last_reset_date = $2, year = $3, month = $4, updated_at = NOW()
       WHERE id = $5`,
      [usage.messageCount, usage.lastResetDate, usage.year, usage.month, usage.id]
    );

    return usage;
  }

  async findForAutoReset(): Promise<MonthlyUsage[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Find all usage records that are not for the current month
    const result = await query(
      `SELECT id, user_id, year, month, message_count, last_reset_date, created_at, updated_at
       FROM monthly_usage
       WHERE (year != $1 OR month != $2)`
    , [currentYear, currentMonth]);

    return result.rows.map(
      (row) =>
        new MonthlyUsage(
          row.id,
          row.user_id,
          row.year,
          row.month,
          row.message_count,
          new Date(row.last_reset_date),
          new Date(row.created_at),
          new Date(row.updated_at)
        )
    );
  }
}

