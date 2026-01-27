// src/utils/asyncHandler.js

const asyncHandler = (fn) => {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
