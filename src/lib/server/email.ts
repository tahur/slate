import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { db } from '$lib/server/db';
import { app_settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
}

/**
 * Get SMTP configuration from database for an organization
 */
export async function getSmtpConfig(orgId: string): Promise<SmtpConfig | null> {
    const settings = await db.query.app_settings.findFirst({
        where: eq(app_settings.org_id, orgId)
    });

    if (!settings || !settings.smtp_enabled || !settings.smtp_host || !settings.smtp_user) {
        return null;
    }

    return {
        host: settings.smtp_host,
        port: settings.smtp_port || 587,
        user: settings.smtp_user,
        pass: settings.smtp_pass || '',
        from: settings.smtp_from || settings.smtp_user,
        secure: settings.smtp_secure || false
    };
}

/**
 * Create a nodemailer transporter from SMTP config
 */
function createTransporter(config: SmtpConfig): Transporter {
    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
}

/**
 * Send an email using the organization's SMTP settings
 */
export async function sendEmail(orgId: string, options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    const config = await getSmtpConfig(orgId);

    if (!config) {
        return {
            success: false,
            error: 'Email is not configured. Please set up SMTP in Settings.'
        };
    }

    try {
        const transporter = createTransporter(config);

        await transporter.sendMail({
            from: config.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, '')
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
}

/**
 * Test SMTP connection with provided config
 */
export async function testSmtpConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = createTransporter(config);
        await transporter.verify();
        return { success: true };
    } catch (error) {
        console.error('SMTP connection test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed'
        };
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    orgName?: string
): Promise<{ success: boolean; error?: string }> {
    // For password reset, we need a way to send email without org context
    // Use environment variables as fallback for system-level emails
    const config = await getSystemSmtpConfig();

    if (!config) {
        return {
            success: false,
            error: 'Email is not configured. Contact your administrator.'
        };
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #fb631b 0%, #ff8e53 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
    </div>
    <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin-top: 0;">Hi,</p>
        <p>We received a request to reset your password${orgName ? ` for <strong>${orgName}</strong>` : ''}.</p>
        <p>Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #fb631b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="${resetUrl}" style="color: #fb631b; word-break: break-all;">${resetUrl}</a>
        </p>
    </div>
</body>
</html>
`;

    try {
        const transporter = createTransporter(config);

        await transporter.sendMail({
            from: config.from,
            to: email,
            subject: 'Reset your password',
            html,
            text: `Reset your password\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
}

/**
 * Get system-level SMTP config (for password reset emails, etc.)
 * Falls back to first org's SMTP config or env variables
 */
async function getSystemSmtpConfig(): Promise<SmtpConfig | null> {
    // First try to get from any organization's settings
    const settings = await db.query.app_settings.findFirst({
        where: eq(app_settings.smtp_enabled, true)
    });

    if (settings && settings.smtp_host && settings.smtp_user) {
        return {
            host: settings.smtp_host,
            port: settings.smtp_port || 587,
            user: settings.smtp_user,
            pass: settings.smtp_pass || '',
            from: settings.smtp_from || settings.smtp_user,
            secure: settings.smtp_secure || false
        };
    }

    // Fallback to environment variables
    const envHost = process.env.SMTP_HOST;
    const envUser = process.env.SMTP_USER;
    const envPass = process.env.SMTP_PASS;

    if (envHost && envUser && envPass) {
        return {
            host: envHost,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: envUser,
            pass: envPass,
            from: process.env.SMTP_FROM || envUser,
            secure: process.env.SMTP_SECURE === 'true'
        };
    }

    return null;
}

/**
 * Check if email is configured (either via settings or env)
 */
export async function isEmailConfigured(): Promise<boolean> {
    const config = await getSystemSmtpConfig();
    return config !== null;
}
