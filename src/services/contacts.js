import createHttpError from 'http-errors';
import { ContactsCollection } from '../db/models/contacts.js';
import { createPaginationMetadata } from '../utils/createPaginationMetadata.js';

export const getAllContacts = async ({ page, perPage, sortOrder, sortBy }) => {
  const offset = (page - 1) * perPage;
  const [data, contactsCount] = await Promise.all([
    ContactsCollection.find()
      .skip(offset)
      .limit(perPage)
      .sort({ [sortBy]: sortOrder }),
    ContactsCollection.find().countDocuments(),
  ]);

  const metadata = createPaginationMetadata(page, perPage, contactsCount);
  if (metadata.page > metadata.totalPages) {
    throw createHttpError(
      400,
      `The queried page ${metadata.page} exceeds the total page count: ${metadata.totalPages}`,
    );
  }
  return { data, ...metadata };
};

export const getContactById = async (contactId) => {
  const contacts = await ContactsCollection.findById(contactId);
  return contacts;
};

export const createContact = async (payload) => {
  const contact = await ContactsCollection.create(payload);
  return contact;
};

export const deleteContact = async (contactId) => {
  const contact = await ContactsCollection.findByIdAndDelete(contactId);
  return contact;
};

export const patchContact = async (contactId, payload) => {
  const updatedContact = await ContactsCollection.findOneAndUpdate(
    {
      _id: contactId,
    },
    { $set: payload },
    { new: true },
  );
  if (!updatedContact) return null;
  return { contact: updatedContact };
};
