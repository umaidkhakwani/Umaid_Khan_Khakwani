import { Router } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { query } from '../../config/database';

const router = Router();
const subscriptionService = new SubscriptionService();

/**
 * Test endpoint to manually trigger renewal job
 * GET /api/test/renewals/process
 */
router.get('/renewals/process', async (req, res) => {
  try {
    await subscriptionService.processAutoRenewals();
    res.json({
      message: 'Renewal job processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        message: error.message,
        statusCode: 500,
      },
    });
  }
});

/**
 * Test endpoint to set renewal date to past (for testing)
 * PATCH /api/test/subscriptions/:subscriptionId/set-renewal-past
 */
router.patch('/subscriptions/:subscriptionId/set-renewal-past', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const daysAgo = parseInt(req.query.days as string, 10) || 1;

    await query(
      `UPDATE subscription_bundles 
       SET renewal_date = NOW() - INTERVAL '${daysAgo} days',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, renewal_date, auto_renew, is_active`,
      [subscriptionId]
    );

    const subscription = await subscriptionService.getSubscriptionById(subscriptionId);

    res.json({
      message: `Renewal date set to ${daysAgo} day(s) ago`,
      subscription: {
        id: subscription.id,
        renewalDate: subscription.renewalDate,
        autoRenew: subscription.autoRenew,
        isActive: subscription.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        message: error.message,
        statusCode: 500,
      },
    });
  }
});

/**
 * Test endpoint to get subscription details
 * GET /api/test/subscriptions/:subscriptionId/details
 */
router.get('/subscriptions/:subscriptionId/details', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(subscriptionId);

    // Get related chat messages count
    const messagesResult = await query(
      `SELECT COUNT(*) as count 
       FROM chat_messages 
       WHERE user_id = $1`,
      [subscription.userId]
    );

    res.json({
      subscription: {
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
      },
      usage: {
        totalMessages: parseInt(messagesResult.rows[0].count, 10),
        messagesUsed: subscription.maxMessages - subscription.remainingMessages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: {
        message: error.message,
        statusCode: 500,
      },
    });
  }
});

export default router;

