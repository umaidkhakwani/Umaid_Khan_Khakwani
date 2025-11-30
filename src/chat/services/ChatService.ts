import { ChatMessageRepository, IChatMessageRepository } from '../repositories/ChatMessageRepository';
import { MonthlyUsageRepository, IMonthlyUsageRepository } from '../repositories/MonthlyUsageRepository';
import { SubscriptionBundleRepository, ISubscriptionBundleRepository } from '../../subscriptions/repositories/SubscriptionBundleRepository';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { QuotaExceededError, SubscriptionRequiredError } from '../../shared/errors/AppError';
import { FREE_MESSAGES_PER_MONTH } from '../../shared/types';

// Simulate OpenAI API delay (1-3 seconds)
const simulateOpenAIDelay = (): Promise<void> => {
  const delay = Math.random() * 2000 + 1000; // 1000-3000ms
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Mock OpenAI response
const generateMockResponse = (question: string): { answer: string; tokens: number } => {
  const answers = [
    `This is a mocked response to: "${question}". In a real implementation, this would be an AI-generated answer.`,
    `Based on your question "${question}", here's a simulated AI response. The actual implementation would use OpenAI's API.`,
    `Mocked AI response: I understand you're asking about "${question}". Here's a generated answer for demonstration purposes.`,
  ];

  const answer = answers[Math.floor(Math.random() * answers.length)];
  // Estimate tokens: roughly 1 token per 4 characters
  const tokens = Math.ceil((question.length + answer.length) / 4);

  return { answer, tokens };
};

export class ChatService {
  constructor(
    private chatMessageRepository: IChatMessageRepository = new ChatMessageRepository(),
    private monthlyUsageRepository: IMonthlyUsageRepository = new MonthlyUsageRepository(),
    private subscriptionBundleRepository: ISubscriptionBundleRepository = new SubscriptionBundleRepository()
  ) {}

  async sendMessage(userId: string, question: string): Promise<ChatMessage> {
    // Check and update monthly usage
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    let monthlyUsage = await this.monthlyUsageRepository.findByUserIdAndMonth(userId, year, month);

    // Check free quota
    if (!monthlyUsage) {
      monthlyUsage = await this.monthlyUsageRepository.create({
        userId,
        year,
        month,
        messageCount: 0,
      });
    }

    // Check if free quota is available
    const hasFreeQuota = monthlyUsage.messageCount < FREE_MESSAGES_PER_MONTH;

    if (!hasFreeQuota) {
      // Check for active subscription bundles with remaining quota
      const activeBundles = await this.subscriptionBundleRepository.findActiveWithRemainingQuota(
        userId
      );

      if (activeBundles.length === 0) {
        throw new SubscriptionRequiredError();
      }

      // Use the bundle with the latest remaining quota (most recently created with quota)
      const bundleToUse = activeBundles[0];
      if (!bundleToUse.canUse()) {
        throw new QuotaExceededError();
      }

      // Deduct from bundle
      const updatedBundle = bundleToUse.useMessage();
      await this.subscriptionBundleRepository.update(updatedBundle);
    } else {
      // Use free quota
      const updatedUsage = monthlyUsage.increment();
      await this.monthlyUsageRepository.update(updatedUsage);
    }

    // Simulate OpenAI API delay
    await simulateOpenAIDelay();

    // Generate mock response
    const { answer, tokens } = generateMockResponse(question);

    // Store the message
    const message = await this.chatMessageRepository.create({
      userId,
      question,
      answer,
      tokens,
    });

    return message;
  }

  async getMessageHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return this.chatMessageRepository.findByUserId(userId, limit);
  }

  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    return this.chatMessageRepository.findById(messageId);
  }
}

