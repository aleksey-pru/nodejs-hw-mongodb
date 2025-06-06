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
