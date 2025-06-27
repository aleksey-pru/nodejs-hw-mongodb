import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import { SessionsCollection } from '../db/models/session.js';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/index.js';

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

  const isEqual = bcrypt.compare(payload.password, user.password);

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
