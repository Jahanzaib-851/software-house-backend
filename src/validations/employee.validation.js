import Joi from 'joi';

export const employeeSchema = Joi.object({
  user: Joi.string().required(), // MongoDB ID of the user
  role: Joi.string().valid('admin', 'manager').required(),
  password: Joi.string().min(6).required(),
  designation: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  salary: Joi.number().allow('', null),
  employmentType: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  // Avatar text hota hai backend par, isliye validation mein zaroori nahi (Multer handle karega)
});