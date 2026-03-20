import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),

  // Twilio
  TWILIO_ACCOUNT_SID: Joi.string().required(),
  TWILIO_AUTH_TOKEN: Joi.string().required(),
  TWILIO_VERIFY_SERVICE_SID: Joi.string().required(),

  // App
  PORT: Joi.number().default(3000),
});
