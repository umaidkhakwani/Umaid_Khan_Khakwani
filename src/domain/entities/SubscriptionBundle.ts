import { SubscriptionTier, BillingCycle } from '../../shared/types';

export class SubscriptionBundle {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tier: SubscriptionTier,
    public readonly billingCycle: BillingCycle,
    public readonly maxMessages: number,
    public readonly remainingMessages: number,
    public readonly price: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly renewalDate: Date | null,
    public readonly autoRenew: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    userId: string,
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    maxMessages: number,
    price: number,
    startDate: Date,
    endDate: Date,
    autoRenew: boolean
  ): {
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
  } {
    return {
      userId,
      tier,
      billingCycle,
      maxMessages,
      remainingMessages: maxMessages,
      price,
      startDate,
      endDate,
      renewalDate: autoRenew ? endDate : null,
      autoRenew,
      isActive: true,
    };
  }

  canUse(): boolean {
    return this.isActive && (this.maxMessages === -1 || this.remainingMessages > 0);
  }

  useMessage(): SubscriptionBundle {
    if (!this.canUse()) {
      throw new Error('Cannot use message: subscription inactive or quota exhausted');
    }

    const newRemaining =
      this.maxMessages === -1 ? -1 : Math.max(0, this.remainingMessages - 1);

    return new SubscriptionBundle(
      this.id,
      this.userId,
      this.tier,
      this.billingCycle,
      this.maxMessages,
      newRemaining,
      this.price,
      this.startDate,
      this.endDate,
      this.renewalDate,
      this.autoRenew,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  cancel(): SubscriptionBundle {
    return new SubscriptionBundle(
      this.id,
      this.userId,
      this.tier,
      this.billingCycle,
      this.maxMessages,
      this.remainingMessages,
      this.price,
      this.startDate,
      this.endDate,
      null,
      false,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  deactivate(): SubscriptionBundle {
    return new SubscriptionBundle(
      this.id,
      this.userId,
      this.tier,
      this.billingCycle,
      this.maxMessages,
      this.remainingMessages,
      this.price,
      this.startDate,
      this.endDate,
      this.renewalDate,
      this.autoRenew,
      false,
      this.createdAt,
      new Date()
    );
  }
}

