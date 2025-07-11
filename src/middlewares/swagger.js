import fs from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import { SWAGGER_PATH } from '../constants/paths.js';

export const setupSwagger = () => {
  try {
    const swaggerContent = JSON.parse(fs.readFileSync(SWAGGER_PATH).toString());
    return [...swaggerUi.serve, swaggerUi.setup(swaggerContent)];
  } catch (error) {
    console.error(error);
    return (req, res) => {
      res.status(500).json({ message: "Can't load swagger" });
    };
  }
};
