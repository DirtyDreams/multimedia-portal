"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let EmailService = EmailService_1 = class EmailService {
    mailerService;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendWelcomeEmail(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send welcome email to ${data.email}:`, error);
            return false;
        }
    }
    async sendPasswordResetEmail(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send password reset email to ${data.email}:`, error);
            return false;
        }
    }
    async sendCommentNotification(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send comment notification to ${data.email}:`, error);
            return false;
        }
    }
    async sendNewsletter(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send newsletter to ${data.email}:`, error);
            return false;
        }
    }
    async sendEmail(to, subject, html) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to: ${to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], EmailService);
//# sourceMappingURL=email.service.js.map