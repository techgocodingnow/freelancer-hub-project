import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'PREFLIGHT'],
  headers: true,
  exposeHeaders: [
    // Standard headers
    'content-type',
    'content-length',
    'etag',
    'cache-control',
    // Electric SQL headers - required for real-time sync
    'electric-handle',
    'electric-offset',
    'electric-schema',
    'electric-cursor',
    'electric-chunk-last-offset',
    'electric-up-to-date',
  ],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
