import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Handlebars from 'handlebars';
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import { SessionsCollection } from '../db/models/session.js';
import {
  APP_DOMAIN,
  FIFTEEN_MINUTES,
  JWT_SECRET,
  ONE_DAY,
} from '../constants/index.js';
import { sendEmail } from '../utils/sendEmail.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATE_DIR } from '../constants/paths.js';

const resetPasswordTemplate = fs.readFileSync(
  path.join(TEMPLATE_DIR, 'reset-password-email-template.html'),
  'utf-8',
);

const createSession = () => ({
  accessToken: crypto.randomBytes(30).toString('base64'),
  refreshToken: crypto.randomBytes(30).toString('base64'),
  accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
  refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
});

export const registerUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });
  if (user) throw createHttpError(409, 'Email in use');
  const encryptedPassword = await bcrypt.hash(payload.password, 10);
  return await UsersCollection.create({
    ...payload,
    password: encryptedPassword,
  });
};

export const loginUser = async (payload) => {
  const user = await UsersCollection.findOne({ email: payload.email });

  if (!user) throw createHttpError(401, 'User not found');

  const isEqual = await bcrypt.compare(payload.password, user.password);

  if (!isEqual) throw createHttpError(401, 'Unauthorized');

  await SessionsCollection.findOneAndDelete({ userId: user._id });

  return await SessionsCollection.create({
    ...createSession(),
    userId: user._id,
  });
};

export const logoutUser = async (sessionId, refreshToken) => {
  await SessionsCollection.findOneAndDelete({
    _id: sessionId,
    refreshToken,
  });
};

export const refreshUsersSession = async (sessionId, refreshToken) => {
  console.log('Looking for session with id:', sessionId);
  console.log('And refreshToken:', refreshToken);
  const session = await SessionsCollection.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  const newSession = createSession();
  console.log('Created new session:', newSession);

  await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });

  return await SessionsCollection.create({
    userId: session.userId,
    ...newSession,
  });
};

export const requestResetPasswordEmail = async (email) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) throw createHttpError(404, 'User not found!');

  const token = jwt.sign(
    {
      sub: user._id,
      email: user.email,
    },
    getEnvVar(JWT_SECRET),
    {
      expiresIn: '5m',
    },
  );
  const template = Handlebars.compile(resetPasswordTemplate);
  const html = template({
    name: user.name,
    link: `${getEnvVar(APP_DOMAIN)}/reset-pwd?token=${token}`,
  });

  await sendEmail({ email, html, subject: 'Reset your password!' });
};

export const resetPassword = async ({ token, password }) => {
  let tokenPayload;

  try {
    tokenPayload = jwt.verify(token, getEnvVar(JWT_SECRET));
  } catch (error) {
    console.log(error);
    throw createHttpError(401, 'Token is expired or invalid.');
  }

  const user = await UsersCollection.findById(tokenPayload.sub);

  if (!user) throw createHttpError(404, 'User not found!');

  const hashedPassword = await bcrypt.hash(password, 10);

  await UsersCollection.findByIdAndUpdate(tokenPayload.sub, {
    password: hashedPassword,
  });

  await SessionsCollection.findOneAndDelete({ userId: tokenPayload.sub });
};
