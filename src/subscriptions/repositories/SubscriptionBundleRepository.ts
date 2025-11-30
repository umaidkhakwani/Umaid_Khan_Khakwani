import { query } from '../../config/database';
import { SubscriptionBundle } from '../../domain/entities/SubscriptionBundle';
import { SubscriptionTier, BillingCycle } from '../../shared/types';

export interface ISubscriptionBundleRepository {
  create(bundle: {
    userId: string;
    tier: SubscriptionTier;
    billingCycle: BillingCycle;
    maxMessages: number;
    remainingMessages: number;
    price: number;
    startDate: Date;
    endDate: Date;
    renewalDate: Date | null;
    autoRenew: boolean;
    isActive: boolean;
  }): Promise<SubscriptionBundle>;
  findByUserId(userId: string): Promise<SubscriptionBundle[]>;
  findActiveByUserId(userId: string): Promise<SubscriptionBundle[]>;
  findById(id: string): Promise<SubscriptionBundle | null>;
  update(bundle: SubscriptionBundle): Promise<SubscriptionBundle>;
  findActiveWithRemainingQuota(userId: string): Promise<SubscriptionBundle[]>;
  findDueForRenewal(): Promise<SubscriptionBundle[]>;
}

export class SubscriptionBundleRepository implements ISubscriptionBundleRepository {
  async create(
    bundle: {
      userId: string;
      tier: SubscriptionTier;
      billingCycle: BillingCycle;
      maxMessages: number;
      remainingMessages: number;
      price: number;
      startDate: Date;
      endDate: Date;
      renewalDate: Date | null;
      autoRenew: boolean;
      isActive: boolean;
    }
  ): Promise<SubscriptionBundle> {
    const result = await query(
      `INSERT INTO subscription_bundles 
       (user_id, tier, billing_cycle, max_messages, remaining_messages, price, 
        start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING id, user_id, tier, billing_cycle, max_messages, remaining_messages, price,
                 start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at`,
      [
        bundle.userId,
        bundle.tier,
        bundle.billingCycle,
        bundle.maxMessages,
        bundle.remainingMessages,
        bundle.price,
        bundle.startDate,
        bundle.endDate,
        bundle.renewalDate,
        bundle.autoRenew,
        bundle.isActive,
      ]
    );

    return this.mapRowToEntity(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<SubscriptionBundle[]> {
    const result = await query(
      `SELECT id, user_id, tier, billing_cycle, max_messages, remaining_messages, price,
              start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at
       FROM subscription_bundles
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async findActiveByUserId(userId: string): Promise<SubscriptionBundle[]> {
    const result = await query(
      `SELECT id, user_id, tier, billing_cycle, max_messages, remaining_messages, price,
              start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at
       FROM subscription_bundles
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async findActiveWithRemainingQuota(userId: string): Promise<SubscriptionBundle[]> {
    const result = await query(
      `SELECT id, user_id, tier, billing_cycle, max_messages, remaining_messages, price,
              start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at
       FROM subscription_bundles
       WHERE user_id = $1 
         AND is_active = true
         AND (max_messages = -1 OR remaining_messages > 0)
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async findById(id: string): Promise<SubscriptionBundle | null> {
    const result = await query(
      `SELECT id, user_id, tier, billing_cycle, max_messages, remaining_messages, price,
              start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at
       FROM subscription_bundles
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async update(bundle: SubscriptionBundle): Promise<SubscriptionBundle> {
    await query(
      `UPDATE subscription_bundles
       SET remaining_messages = $1, renewal_date = $2, auto_renew = $3, 
           is_active = $4, updated_at = NOW()
       WHERE id = $5`,
      [bundle.remainingMessages, bundle.renewalDate, bundle.autoRenew, bundle.isActive, bundle.id]
    );

    return bundle;
  }

  async findDueForRenewal(): Promise<SubscriptionBundle[]> {
    const result = await query(
      `SELECT id, user_id, tier, billing_cycle, max_messages, remaining_messages, price,
              start_date, end_date, renewal_date, auto_renew, is_active, created_at, updated_at
       FROM subscription_bundles
       WHERE is_active = true
         AND auto_renew = true
         AND renewal_date IS NOT NULL
         AND renewal_date <= NOW()
       ORDER BY renewal_date ASC`
    );

    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  private mapRowToEntity(row: any): SubscriptionBundle {
    return new SubscriptionBundle(
      row.id,
      row.user_id,
      row.tier as SubscriptionTier,
      row.billing_cycle as BillingCycle,
      row.max_messages,
      row.remaining_messages,
      parseFloat(row.price),
      new Date(row.start_date),
      new Date(row.end_date),
      row.renewal_date ? new Date(row.renewal_date) : null,
      row.auto_renew,
      row.is_active,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}

