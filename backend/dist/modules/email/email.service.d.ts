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
export declare class EmailService {
    private mailerService;
    private readonly logger;
    constructor(mailerService: MailerService);
    sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean>;
    sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean>;
    sendCommentNotification(data: CommentNotificationEmailData): Promise<boolean>;
    sendNewsletter(data: NewsletterEmailData): Promise<boolean>;
    sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}
