const Joi = require('@hapi/joi');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

module.exports = {
  createPatientSchema: Joi.object({
    regNo: Joi.string().required(),
    name: Joi.string().required(),
    rank: Joi.string().required(),
    unit: Joi.string().required(),
    operation: Joi.object({
      date: Joi.date().iso().required(),
      type: Joi.string().required(),
      diagnosis: Joi.string().required(),
      indication: Joi.string().required(),
      priority: Joi.string().valid('emergency', 'urgent', 'routine').required(),
      otType: Joi.string().valid('Main', 'Modular').default('Main'),
      anesthesia: Joi.string().valid(
        'ga', 'gaEpi', 'gaCaudal', 'shortGa', 'tiva', 'sab', 'cse', 'caudal', 'bb', 'bbSab', 'local', 'sedation'
      ).required(),
      status: Joi.string().valid('scheduled', 'postponed', 'cancelled', 'completed')
    }).required(),
    surgeon: Joi.string().required(),
    anaesthetist: Joi.string().required(),
    nurse: Joi.string().required(),
    lastMeal: Joi.string().required()
  }),

  updateStatusSchema: Joi.object({
    status: Joi.string().valid('scheduled', 'postponed', 'cancelled', 'completed').required(),
    newDate: Joi.date().iso().when('status', {
      is: 'postponed',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  dateParamSchema: Joi.object({
    date: Joi.string().pattern(dateRegex).required()
  }),

  otTypeSchema: Joi.object({
    type: Joi.string().valid('main', 'modular').required()
  }),

  statusParamSchema: Joi.object({
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled').required()
  })
};