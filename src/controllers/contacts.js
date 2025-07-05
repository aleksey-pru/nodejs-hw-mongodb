import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  patchContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationsParams.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

const parseSortOrder = (value) => {
  if (['asc', 'desc'].includes(value)) {
    return value;
  }
  return 'asc';
};

const parseSortBy = (value) => {
  if (['name', 'phoneNumber', 'email', 'isFavourite'].includes(value)) {
    return value;
  }
  return '_id';
};

const parseSortParams = (obj) => {
  return {
    sortOrder: parseSortOrder(obj.sortOrder),
    sortBy: parseSortBy(obj.sortBy),
  };
};

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const { _id: userId } = req.user;
  const students = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    userId,
  });
  res.status(200).json({
    status: 200,
    message: 'Successfully found contacts!',
    data: students,
  });
};

export const getContactByIdController = async (req, res, next) => {
  const { contactId } = req.params;
  const { _id: userId } = req.user;
  const contact = await getContactById({ contactId, userId });

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  res.status(200).json({
    status: 200,
    message: `Successfully found contact with id ${contactId}`,
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  const { _id: userId } = req.user;
  const photo = req.file;
  let photoUrl;
  if (photo) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      photoUrl = await saveFileToUploadDir(photo);
    }
  }
  const contact = await createContact({
    ...req.body,
    userId,
    photo: photoUrl,
  });
  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
};

export const deleteContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const { _id: userId } = req.user;
  const contact = await deleteContact({ contactId, userId });
  if (!contact) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }
  res.status(204).send();
};

export const patchContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const photo = req.file;
  let photoUrl;
  if (photo) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      photoUrl = await saveFileToUploadDir(photo);
    }
  }

  const { _id: userId } = req.user;
  const updatedData = {
    ...req.body,
    photo: photoUrl,
  };
  const result = await patchContact({ contactId, userId, body: updatedData });
  if (!result) {
    next(createHttpError(404, 'Contact not found'));
  }
  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: result.contact,
  });
};
