import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';

const router = Router();
const chatController = new ChatController();

router.post('/users/:userId/messages', chatController.sendMessage);
router.get('/users/:userId/messages', chatController.getMessageHistory);
router.get('/messages/:messageId', chatController.getMessageById);

export default router;

