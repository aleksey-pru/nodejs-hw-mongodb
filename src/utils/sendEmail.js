import { createTransport } from 'nodemailer';
import { getEnvVar } from './getEnvVar.js';
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from '../constants/index.js';
import createHttpError from 'http-errors';

const transporter = createTransport({
  host: getEnvVar(SMTP_HOST),
  port: getEnvVar(SMTP_PORT),
  secure: true,
  auth: {
    user: getEnvVar(SMTP_USER),
    pass: getEnvVar(SMTP_PASS),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async ({ email, html, subject }) => {
  try {
    await transporter.sendMail({
      to: email,
      html,
      subject,
      from: getEnvVar(SMTP_FROM),
    });
  } catch (error) {
    console.error(error);
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }
};
