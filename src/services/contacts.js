import createHttpError from 'http-errors';
import { ContactsCollection } from '../db/models/contacts.js';
import { createPaginationMetadata } from '../utils/createPaginationMetadata.js';

export const getAllContacts = async ({
  page,
  perPage,
  sortOrder,
  sortBy,
  userId,
}) => {
  const offset = (page - 1) * perPage;
  const filter = { userId };
  const [data, contactsCount] = await Promise.all([
    ContactsCollection.find(filter)
      .skip(offset)
      .limit(perPage)
      .sort({ [sortBy]: sortOrder }),
    ContactsCollection.find().countDocuments(filter),
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

export const getContactById = async ({ contactId, userId }) => {
  const contacts = await ContactsCollection.findById({
    _id: contactId,
    userId,
  });
  return contacts;
};

export const createContact = async (payload) => {
  const contact = await ContactsCollection.create(payload);
  return contact;
};

export const deleteContact = async ({ contactId, userId }) => {
  const contact = await ContactsCollection.findByIdAndDelete({
    _id: contactId,
    userId,
  });
  return contact;
};

export const patchContact = async ({ contactId, userId, body }) => {
  const updatedContact = await ContactsCollection.findOneAndUpdate(
    { _id: contactId, userId },
    { $set: body },
    { new: true },
  );
  if (!updatedContact) return null;
  return { contact: updatedContact };
};
