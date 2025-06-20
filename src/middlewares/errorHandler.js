import { HttpError } from 'http-errors';
export const errorHandler = (err, req, res, next) => {
  if (err.isJoi) {
    return res.status(400).json({
      status: 400,
      errorMessage: 'Validation error',
      id: req.id,
      details: err.details.map(({ path, message }) => ({ path, message })),
    });
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
      data: err,
    });
    return;
  }
  res.status(500).json({
    status: 500,
    message: 'Something went wrong',
    data: err.message,
  });
};
