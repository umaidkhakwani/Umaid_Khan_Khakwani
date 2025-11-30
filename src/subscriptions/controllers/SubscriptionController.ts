import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { SubscriptionTier, BillingCycle } from '../../shared/types';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { tier, billingCycle, autoRenew } = req.body;

      if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
        res.status(400).json({
          error: `Invalid tier. Must be one of: ${Object.values(SubscriptionTier).join(', ')}`,
        });
        return;
      }

      if (!billingCycle || !Object.values(BillingCycle).includes(billingCycle)) {
        res.status(400).json({
          error: `Invalid billingCycle. Must be one of: ${Object.values(BillingCycle).join(', ')}`,
        });
        return;
      }

      const subscription = await this.subscriptionService.createSubscription(
        userId,
        tier,
        billingCycle,
        autoRenew === true
      );

      res.status(201).json({
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        maxMessages: subscription.maxMessages,
        remainingMessages: subscription.remainingMessages,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;

      const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);

      res.json({
        subscriptions: subscriptions.map((sub) => {
          // Handle free quota (no id, createdAt)
          if ('tier' in sub && sub.tier === 'Free') {
            return {
              id: `free-${sub.year}-${sub.month}`, // Virtual ID for free quota
              userId: userId,
              tier: sub.tier,
              billingCycle: sub.billingCycle,
              maxMessages: sub.maxMessages,
              remainingMessages: sub.remainingMessages,
              price: sub.price,
              startDate: sub.startDate,
              endDate: sub.endDate,
              renewalDate: sub.renewalDate,
              autoRenew: sub.autoRenew,
              isActive: sub.isActive,
              createdAt: sub.startDate, // Use startDate as createdAt for free quota
            };
          }
          // Handle paid subscriptions
          return {
            id: sub.id,
            userId: sub.userId,
            tier: sub.tier,
            billingCycle: sub.billingCycle,
            maxMessages: sub.maxMessages,
            remainingMessages: sub.remainingMessages,
            price: sub.price,
            startDate: sub.startDate,
            endDate: sub.endDate,
            renewalDate: sub.renewalDate,
            autoRenew: sub.autoRenew,
            isActive: sub.isActive,
            createdAt: sub.createdAt,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveSubscriptions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      const subscriptions = await this.subscriptionService.getActiveSubscriptions(userId);

      res.json({
        subscriptions: subscriptions.map((sub) => {
          // Handle free quota (no id, createdAt)
          if ('tier' in sub && sub.tier === 'Free') {
            return {
              id: `free-${sub.year}-${sub.month}`, // Virtual ID for free quota
              userId: userId,
              tier: sub.tier,
              billingCycle: sub.billingCycle,
              maxMessages: sub.maxMessages,
              remainingMessages: sub.remainingMessages,
              price: sub.price,
              startDate: sub.startDate,
              endDate: sub.endDate,
              renewalDate: sub.renewalDate,
              autoRenew: sub.autoRenew,
              isActive: sub.isActive,
              createdAt: sub.startDate, // Use startDate as createdAt for free quota
            };
          }
          // Handle paid subscriptions
          return {
            id: sub.id,
            userId: sub.userId,
            tier: sub.tier,
            billingCycle: sub.billingCycle,
            maxMessages: sub.maxMessages,
            remainingMessages: sub.remainingMessages,
            price: sub.price,
            startDate: sub.startDate,
            endDate: sub.endDate,
            renewalDate: sub.renewalDate,
            autoRenew: sub.autoRenew,
            isActive: sub.isActive,
            createdAt: sub.createdAt,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  };

  getSubscriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subscriptionId } = req.params;

      const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);

      res.json({
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        maxMessages: subscription.maxMessages,
        remainingMessages: subscription.remainingMessages,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  cancelSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subscriptionId } = req.params;

      const subscription = await this.subscriptionService.cancelSubscription(subscriptionId);

      res.json({
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        maxMessages: subscription.maxMessages,
        remainingMessages: subscription.remainingMessages,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
        message: 'Subscription cancelled. It will remain active until the end of the billing cycle.',
      });
    } catch (error) {
      next(error);
    }
  };

  toggleAutoRenew = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subscriptionId } = req.params;
      const { autoRenew } = req.body;

      if (typeof autoRenew !== 'boolean') {
        res.status(400).json({ error: 'autoRenew must be a boolean value' });
        return;
      }

      const subscription = await this.subscriptionService.toggleAutoRenew(
        subscriptionId,
        autoRenew
      );

      res.json({
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        maxMessages: subscription.maxMessages,
        remainingMessages: subscription.remainingMessages,
        price: subscription.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };
}

