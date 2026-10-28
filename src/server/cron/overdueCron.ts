import cron from 'node-cron';
import { LoanService } from '../services/loanService.ts';

export function setupCronJobs(): void {
  // Check for overdue loans at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ [CRON] Running hourly overdue equipment verification...');
    try {
      await LoanService.flagOverdueLoans();
    } catch (err) {
      console.error('❌ [CRON ERROR] Failed during overdue check:', err);
    }
  });

  // Check for expired pending requests every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await LoanService.expireStalePendingLoans(30);
    } catch (err) {
      console.error('❌ [CRON ERROR] Failed during pending expiry check:', err);
    }
  });

  console.log('⏰ Scheduled cron jobs: Overdue loans check (hourly) & Pending expiry (every 5 min)');
}
