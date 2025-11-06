import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../../modules/email/email.service';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(`Processing email job ${job.id}`);
    const { to, subject, html } = job.data;

    try {
      await job.progress(10);

      this.logger.log(`Sending email to: ${to}`);

      await job.progress(30);

      // Use EmailService to send the email
      const success = await this.emailService.sendEmail(to, subject, html || '');

      await job.progress(100);

      if (!success) {
        throw new Error('Email sending failed');
      }

      this.logger.log(`Email sent successfully to: ${to}`);

      return {
        success: true,
        sentAt: new Date(),
        to,
        subject,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  @Process('send-welcome-email')
  async handleWelcomeEmail(job: Job<{ email: string; name: string; loginUrl?: string }>) {
    this.logger.log(`Processing welcome email job ${job.id}`);
    const { email, name, loginUrl } = job.data;

    try {
      await job.progress(10);

      this.logger.log(`Sending welcome email to: ${email}`);
      await job.progress(30);

      // Use EmailService to send welcome email with template
      const success = await this.emailService.sendWelcomeEmail({
        email,
        name,
        loginUrl: loginUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
      });

      await job.progress(100);

      if (!success) {
        throw new Error('Welcome email sending failed');
      }

      this.logger.log(`Welcome email sent successfully to: ${email}`);

      return {
        success: true,
        sentAt: new Date(),
        to: email,
        subject: 'Welcome to Multimedia Portal!',
      };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  @Process('send-notification-email')
  async handleNotificationEmail(
    job: Job<{ email: string; notification: string }>,
  ) {
    this.logger.log(`Processing notification email job ${job.id}`);
    const { email, notification } = job.data;

    try {
      await job.progress(10);

      this.logger.log(`Sending notification email to: ${email}`);
      await job.progress(50);

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await job.progress(100);
      this.logger.log(`Notification email sent successfully to: ${email}`);

      return {
        success: true,
        sentAt: new Date(),
        to: email,
        subject: 'New Notification',
      };
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${email}:`, error);
      throw error;
    }
  }
}
