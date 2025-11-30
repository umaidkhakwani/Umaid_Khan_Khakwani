import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';

const router = Router();
const subscriptionController = new SubscriptionController();

router.post('/users/:userId/subscriptions', subscriptionController.createSubscription);
router.get('/users/:userId/subscriptions', subscriptionController.getUserSubscriptions);
router.get('/users/:userId/subscriptions/active', subscriptionController.getActiveSubscriptions);
router.get('/subscriptions/:subscriptionId', subscriptionController.getSubscriptionById);
router.patch('/subscriptions/:subscriptionId/cancel', subscriptionController.cancelSubscription);
router.patch('/subscriptions/:subscriptionId/auto-renew', subscriptionController.toggleAutoRenew);

export default router;

