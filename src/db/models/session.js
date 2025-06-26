import { model, Schema, Types } from 'mongoose';

const sessionSchema = new Schema({
  userId: { type: Types.ObjectId, required: true, ref: 'users' },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  accessTokenValidUntil: { type: Date, required: true },
  refreshTokenValidUntil: { type: Date, required: true },
});

export const SessionsCollection = model('sessions', sessionSchema);
