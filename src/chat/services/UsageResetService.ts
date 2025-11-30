import { MonthlyUsageRepository, IMonthlyUsageRepository } from '../repositories/MonthlyUsageRepository';

export class UsageResetService {
  constructor(
    private monthlyUsageRepository: IMonthlyUsageRepository = new MonthlyUsageRepository()
  ) {}

  async resetMonthlyUsageIfNeeded(): Promise<void> {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Only reset on the 1st of the month
    if (currentDay !== 1) {
      return;
    }

    // Find all monthly usage records from previous months
    const usagesToReset = await this.monthlyUsageRepository.findForAutoReset();

    // Get unique user IDs
    const userIds = [...new Set(usagesToReset.map((usage) => usage.userId))];

    for (const userId of userIds) {
      // Check if a record already exists for the current month
      let currentUsage = await this.monthlyUsageRepository.findByUserIdAndMonth(
        userId,
        currentYear,
        currentMonth
      );

      if (!currentUsage) {
        // Create a new record for the current month with count 0
        currentUsage = await this.monthlyUsageRepository.create({
          userId,
          year: currentYear,
          month: currentMonth,
          messageCount: 0,
        });
      } else if (currentUsage.messageCount > 0) {
        // Reset count to 0 if it's not already 0
        const resetUsage = currentUsage.reset(currentYear, currentMonth);
        await this.monthlyUsageRepository.update(resetUsage);
      }
    }
  }
}

