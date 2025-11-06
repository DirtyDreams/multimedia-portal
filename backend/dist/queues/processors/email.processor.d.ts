import type { Job } from 'bull';
import { EmailService } from '../../modules/email/email.service';
export interface EmailJobData {
    to: string;
    subject: string;
    body: string;
    html?: string;
}
export declare class EmailProcessor {
    private emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    handleSendEmail(job: Job<EmailJobData>): Promise<{
        success: boolean;
        sentAt: Date;
        to: string;
        subject: string;
    }>;
    handleWelcomeEmail(job: Job<{
        email: string;
        name: string;
        loginUrl?: string;
    }>): Promise<{
        success: boolean;
        sentAt: Date;
        to: string;
        subject: string;
    }>;
    handleNotificationEmail(job: Job<{
        email: string;
        notification: string;
    }>): Promise<{
        success: boolean;
        sentAt: Date;
        to: string;
        subject: string;
    }>;
}
