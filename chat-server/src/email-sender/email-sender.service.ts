import { Injectable } from '@nestjs/common';
import { SendEmailDto } from './dto/send-email.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from 'src/user/schema/user.schema';
@Injectable()
export class EmailSenderService {
  constructor(private readonly mailService: MailerService) {}

  async sendMail(recipient: string, subject: string, message: string) {
    await this.mailService.sendMail({
      from: `"PhotoEditor Support" <info@editImage.com>`,
      to: recipient,
      subject: subject,
      html: message,
    });
  }

  async sendActivationEmail(recipient: User, otpCode: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h3>${recipient.firstName}, welcome to PhotoEditor!</h3>
      <p>Thank you for signing up. To activate your acount use code below:</p>
      <div 
        style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;"
      >
        ${otpCode}
      </div>
      <p>Activation code expires in 3 minutes, after that you need to try to sign in to request a new activation code. <br></p>
      <p>If you did not sign up for this account, please ignore this email.</p>
      <p>Best regards,<br/>PhotoEditor Team</p>
      </div>
    `;

    await this.sendMail(recipient.email, 'Account Activation Code', html);
  }

  async sendResetPasswordEmail(recipient: User, resetToken: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h3>Dear ${recipient.firstName},</h3>
      <p>To reset your password, please click the link below:</p>
      <a 
        href="http://localhost:3000/reset-password?token=${resetToken}" 
        style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;"
      >
        Reset Password
      </a>
      <p>Activation code is valid for 3 minutes<br></p>

      <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `;

    await this.sendMail(recipient.email, 'Reset Password', html);
  }
}
