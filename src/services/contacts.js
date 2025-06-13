import { ContactsCollection } from '../db/models/contacts.js';

export const getAllContacts = async () => {
  const contacts = await ContactsCollection.find();
  console.log(contacts);
  return contacts;
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
