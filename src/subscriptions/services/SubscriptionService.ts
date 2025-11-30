import {
  SubscriptionBundleRepository,
  ISubscriptionBundleRepository,
} from '../repositories/SubscriptionBundleRepository';
import { UserRepository, IUserRepository } from '../repositories/UserRepository';
import { MonthlyUsageRepository, IMonthlyUsageRepository } from '../../chat/repositories/MonthlyUsageRepository';
import { SubscriptionBundle } from '../../domain/entities/SubscriptionBundle';
import { SubscriptionTier, BillingCycle, SUBSCRIPTION_TIERS, FREE_MESSAGES_PER_MONTH } from '../../shared/types';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';

export interface FreeQuotaInfo {
  tier: 'Free';
  maxMessages: number;
  remainingMessages: number;
  billingCycle: 'monthly';
  price: 0;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: true;
  isActive: true;
  year: number;
  month: number;
}

export class SubscriptionService {
  constructor(
    private subscriptionRepository: ISubscriptionBundleRepository = new SubscriptionBundleRepository(),
    private userRepository: IUserRepository = new UserRepository(),
    private monthlyUsageRepository: IMonthlyUsageRepository = new MonthlyUsageRepository()
  ) {}

  async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    autoRenew: boolean = false
  ): Promise<SubscriptionBundle> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Get tier configuration
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    if (!tierConfig) {
      throw new ValidationError(`Invalid subscription tier: ${tier}`);
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === BillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Adjust price based on billing cycle
    const price = billingCycle === BillingCycle.YEARLY ? tierConfig.price * 10 : tierConfig.price;

    const bundle = SubscriptionBundle.create(
      userId,
      tier,
      billingCycle,
      tierConfig.maxMessages,
      price,
      startDate,
      endDate,
      autoRenew
    );

    return this.subscriptionRepository.create(bundle);
  }

  async getFreeQuotaInfo(userId: string): Promise<FreeQuotaInfo | null> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let monthlyUsage = await this.monthlyUsageRepository.findByUserIdAndMonth(userId, year, month);

    // If no usage record exists, user has full free quota
    const messageCount = monthlyUsage ? monthlyUsage.messageCount : 0;
    const remainingMessages = Math.max(0, FREE_MESSAGES_PER_MONTH - messageCount);

    // Calculate month start and end dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of current month
    const renewalDate = new Date(year, month, 1); // 1st of next month

    return {
      tier: 'Free',
      maxMessages: FREE_MESSAGES_PER_MONTH,
      remainingMessages,
      billingCycle: 'monthly',
      price: 0,
      startDate,
      endDate,
      renewalDate,
      autoRenew: true,
      isActive: true,
      year,
      month,
    };
  }

  async getUserSubscriptions(userId: string): Promise<(SubscriptionBundle | FreeQuotaInfo)[]> {
    const subscriptions = await this.subscriptionRepository.findByUserId(userId);
    const freeQuota = await this.getFreeQuotaInfo(userId);

    // Return free quota first, then paid subscriptions
    return freeQuota ? [freeQuota, ...subscriptions] : subscriptions;
  }

  async getActiveSubscriptions(userId: string): Promise<(SubscriptionBundle | FreeQuotaInfo)[]> {
    const subscriptions = await this.subscriptionRepository.findActiveByUserId(userId);
    const freeQuota = await this.getFreeQuotaInfo(userId);

    // Return free quota first, then paid subscriptions
    return freeQuota ? [freeQuota, ...subscriptions] : subscriptions;
  }

  async getSubscriptionById(subscriptionId: string): Promise<SubscriptionBundle> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Subscription');
    }
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<SubscriptionBundle> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    const cancelled = subscription.cancel();
    return this.subscriptionRepository.update(cancelled);
  }

  async toggleAutoRenew(subscriptionId: string, autoRenew: boolean): Promise<SubscriptionBundle> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    const updated = new SubscriptionBundle(
      subscription.id,
      subscription.userId,
      subscription.tier,
      subscription.billingCycle,
      subscription.maxMessages,
      subscription.remainingMessages,
      subscription.price,
      subscription.startDate,
      subscription.endDate,
      autoRenew ? subscription.endDate : null,
      autoRenew,
      subscription.isActive,
      subscription.createdAt,
      new Date()
    );
    return this.subscriptionRepository.update(updated);
  }

  async processAutoRenewals(): Promise<void> {
    const subscriptionsDueForRenewal = await this.subscriptionRepository.findDueForRenewal();

    for (const subscription of subscriptionsDueForRenewal) {
      await this.renewSubscription(subscription);
    }
  }

  private async renewSubscription(subscription: SubscriptionBundle): Promise<SubscriptionBundle> {
    // Simulate payment processing (randomly fail 10% of the time)
    const paymentSucceeded = Math.random() > 0.1;

    if (!paymentSucceeded) {
      // Payment failed - deactivate subscription
      const deactivated = subscription.deactivate();
      return this.subscriptionRepository.update(deactivated);
    }

    // Payment succeeded - create new subscription period
    const newStartDate = new Date(subscription.endDate);
    const newEndDate = new Date(subscription.endDate);
    if (subscription.billingCycle === BillingCycle.MONTHLY) {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    const renewed = SubscriptionBundle.create(
      subscription.userId,
      subscription.tier,
      subscription.billingCycle,
      subscription.maxMessages,
      subscription.price,
      newStartDate,
      newEndDate,
      subscription.autoRenew
    );

    // Deactivate old subscription
    const deactivated = subscription.deactivate();
    await this.subscriptionRepository.update(deactivated);

    // Create new subscription
    return this.subscriptionRepository.create(renewed);
  }
}

