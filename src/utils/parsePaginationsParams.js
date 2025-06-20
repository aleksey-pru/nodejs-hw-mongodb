import { parseNumber } from './parseNumber.js';

export const parsePaginationParams = (obj) => {
  return {
    page: parseNumber(obj.page, 1),
    perPage: parseNumber(obj.perPage, 10),
  };
};
