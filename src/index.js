import { initMongoConnection } from './db/initMongoConnection.js';
import { setupServer } from './server.js';

const bootsrap = async () => {
  await initMongoConnection();
  setupServer();
};

bootsrap();
