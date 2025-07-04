import cloudinary from 'cloudinary';
import createHttpError from 'http-errors';
import fs from 'node:fs/promises';
import { getEnvVar } from './getEnvVar.js';
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from '../constants/index.js';

cloudinary.v2.config({
  secure: true,
  cloud_name: getEnvVar(CLOUDINARY_CLOUD_NAME),
  api_key: getEnvVar(CLOUDINARY_API_KEY),
  api_secret: getEnvVar(CLOUDINARY_API_SECRET),
});

export const saveFileToCloudinary = async (file) => {
  try {
    const response = await cloudinary.v2.uploader.upload(file.path);
    await fs.unlink(file.path);
    return response.secure_url;
  } catch (error) {
    console.error(error);
    throw createHttpError(500, 'Failed to upload image to cloudinary');
  }
};
