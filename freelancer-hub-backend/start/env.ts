/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Electric SQL
  |----------------------------------------------------------
  */
  ELECTRIC_URL: Env.schema.string.optional(),
  ELECTRIC_SOURCE_ID: Env.schema.string.optional(),
  ELECTRIC_SOURCE_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring email service (Resend)
  | Note: All email settings are optional for development.
  | For production, set these to enable email functionality.
  |----------------------------------------------------------
  */
  RESEND_API_KEY: Env.schema.string.optional(),
  EMAIL_FROM: Env.schema.string.optional(),
  EMAIL_FROM_NAME: Env.schema.string.optional(),
  FRONTEND_URL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Backblaze B2 storage
  |----------------------------------------------------------
  */
  B2_ENDPOINT: Env.schema.string.optional(),
  B2_REGION: Env.schema.string.optional(),
  B2_ACCESS_KEY_ID: Env.schema.string.optional(),
  B2_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  B2_BUCKET_NAME: Env.schema.string.optional(),
})
