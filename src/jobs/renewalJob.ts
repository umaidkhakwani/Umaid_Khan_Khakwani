import { SubscriptionService } from '../subscriptions/services/SubscriptionService';
import { UsageResetService } from '../chat/services/UsageResetService';

export class RenewalJob {
  private subscriptionService: SubscriptionService;
  private usageResetService: UsageResetService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.usageResetService = new UsageResetService();
  }

  async run(): Promise<void> {
    try {
      console.log('Running renewal job...');
      
      // Process auto-renewals
      await this.subscriptionService.processAutoRenewals();
      console.log('Auto-renewals processed');

      // Reset monthly usage if needed
      await this.usageResetService.resetMonthlyUsageIfNeeded();
      console.log('Monthly usage reset checked');

      console.log('Renewal job completed');
    } catch (error) {
      console.error('Error in renewal job:', error);
      throw error;
    }
  }
}

// Run job every hour (in production, use a proper scheduler like node-cron)
export const startRenewalJob = (): void => {
  const job = new RenewalJob();
  
  // Run immediately on startup
  job.run().catch(console.error);

  // Then run every hour
  setInterval(() => {
    job.run().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
};

