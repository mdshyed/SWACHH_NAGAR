const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, "'"));
    throw new ApiError(422, 'Validation failed', errors);
  }
  req[source] = value;
  next();
};

module.exports = validate;
