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
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const email_service_1 = require("../../modules/email/email.service");
let EmailProcessor = EmailProcessor_1 = class EmailProcessor {
    emailService;
    logger = new common_1.Logger(EmailProcessor_1.name);
    constructor(emailService) {
        this.emailService = emailService;
    }
    async handleSendEmail(job) {
        this.logger.log(`Processing email job ${job.id}`);
        const { to, subject, html } = job.data;
        try {
            await job.progress(10);
            this.logger.log(`Sending email to: ${to}`);
            await job.progress(30);
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
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }
    async handleWelcomeEmail(job) {
        this.logger.log(`Processing welcome email job ${job.id}`);
        const { email, name, loginUrl } = job.data;
        try {
            await job.progress(10);
            this.logger.log(`Sending welcome email to: ${email}`);
            await job.progress(30);
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
        }
        catch (error) {
            this.logger.error(`Failed to send welcome email to ${email}:`, error);
            throw error;
        }
    }
    async handleNotificationEmail(job) {
        this.logger.log(`Processing notification email job ${job.id}`);
        const { email, notification } = job.data;
        try {
            await job.progress(10);
            this.logger.log(`Sending notification email to: ${email}`);
            await job.progress(50);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await job.progress(100);
            this.logger.log(`Notification email sent successfully to: ${email}`);
            return {
                success: true,
                sentAt: new Date(),
                to: email,
                subject: 'New Notification',
            };
        }
        catch (error) {
            this.logger.error(`Failed to send notification email to ${email}:`, error);
            throw error;
        }
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)('send-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleSendEmail", null);
__decorate([
    (0, bull_1.Process)('send-welcome-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleWelcomeEmail", null);
__decorate([
    (0, bull_1.Process)('send-notification-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleNotificationEmail", null);
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bull_1.Processor)('email'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map