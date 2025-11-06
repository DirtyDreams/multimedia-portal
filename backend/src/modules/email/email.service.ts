import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface WelcomeEmailData {
  email: string;
  name: string;
  loginUrl: string;
}

export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetUrl: string;
  expiryHours: number;
}

export interface CommentNotificationEmailData {
  email: string;
  recipientName: string;
  commenterName: string;
  contentTitle: string;
  commentContent: string;
  commentDate: string;
  contentUrl: string;
  unsubscribeUrl: string;
}

export interface NewsletterEmailData {
  email: string;
  name: string;
  newsletterTitle: string;
  introText: string;
  articles: Array<{
    title: string;
    excerpt: string;
    url: string;
  }>;
  unsubscribeUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Welcome to Multimedia Portal!',
        template: 'welcome',
        context: {
          name: data.name,
          loginUrl: data.loginUrl,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Welcome email sent to: ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.email}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        context: {
          name: data.name,
          resetUrl: data.resetUrl,
          expiryHours: data.expiryHours,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Password reset email sent to: ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${data.email}:`, error);
      return false;
    }
  }

  /**
   * Send comment notification email
   */
  async sendCommentNotification(data: CommentNotificationEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: `New comment on "${data.contentTitle}"`,
        template: 'comment-notification',
        context: {
          recipientName: data.recipientName,
          commenterName: data.commenterName,
          contentTitle: data.contentTitle,
          commentContent: data.commentContent,
          commentDate: data.commentDate,
          contentUrl: data.contentUrl,
          unsubscribeUrl: data.unsubscribeUrl,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Comment notification email sent to: ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send comment notification to ${data.email}:`, error);
      return false;
    }
  }

  /**
   * Send newsletter email
   */
  async sendNewsletter(data: NewsletterEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: data.newsletterTitle,
        template: 'newsletter',
        context: {
          name: data.name,
          newsletterTitle: data.newsletterTitle,
          introText: data.introText,
          articles: data.articles,
          unsubscribeUrl: data.unsubscribeUrl,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Newsletter sent to: ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send newsletter to ${data.email}:`, error);
      return false;
    }
  }

  /**
   * Send generic email
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }
}
