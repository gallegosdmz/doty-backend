import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';
import VerificationEmail from './templates/VerificationEmail';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
    } else {
      this.logger.warn('RESEND_API_KEY not found. Emails will only be logged.');
    }
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const htmlObj = await render(
      React.createElement(VerificationEmail, { validationCode: code }),
    );
    // Depending on react-email version, render might return string or Promise<string>.
    // We await just in case newer async renders are used.
    const html = String(htmlObj);

    // In development or if Api key is missing, mock the email
    if (!this.isConfigured) {
      this.logger.log(
        `[Mock Email] Sending verification code ${code} to ${email}`,
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Doty App <onboarding@resend.dev>', // Update with a verified domain later
        to: email,
        subject: 'Código de verificación corporativo',
        html: html,
      });

      if (error) {
        this.logger.error('Resend API Error', error);
        throw new Error(error.message);
      }

      this.logger.log(
        `Verification email sent to ${email} with ID: ${data?.id}`,
      );
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }
}
