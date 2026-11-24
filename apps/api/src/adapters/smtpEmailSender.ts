import nodemailer from 'nodemailer';
import type { EmailSender, EmailMessage } from '../domain/ports.js';

export interface SmtpConfig {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}

export class SmtpEmailSender implements EmailSender {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(cfg: SmtpConfig) {
    this.from = cfg.from;
    this.transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: false, // Mailpit / local SMTP: no TLS
      ...(cfg.user && cfg.pass
        ? { auth: { user: cfg.user, pass: cfg.pass } }
        : {}),
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
