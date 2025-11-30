import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/ChatService';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { question } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        res.status(400).json({ error: 'Question is required and must be a non-empty string' });
        return;
      }

      const message = await this.chatService.sendMessage(userId, question.trim());

      res.status(201).json({
        id: message.id,
        userId: message.userId,
        question: message.question,
        answer: message.answer,
        tokens: message.tokens,
        createdAt: message.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  getMessageHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const messages = await this.chatService.getMessageHistory(userId, limit);

      res.json({
        messages: messages.map((msg) => ({
          id: msg.id,
          userId: msg.userId,
          question: msg.question,
          answer: msg.answer,
          tokens: msg.tokens,
          createdAt: msg.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  getMessageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId } = req.params;

      const message = await this.chatService.getMessageById(messageId);

      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.json({
        id: message.id,
        userId: message.userId,
        question: message.question,
        answer: message.answer,
        tokens: message.tokens,
        createdAt: message.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };
}

