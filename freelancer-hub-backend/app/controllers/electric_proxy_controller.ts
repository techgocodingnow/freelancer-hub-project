import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'

export default class ElectricProxyController {
  /**
   * Proxy Electric HTTP API for notifications
   * This endpoint enforces authentication and tenant isolation
   */
  async notifications({ auth, tenant, request, response }: HttpContext) {
    try {
      // Get Electric URL from environment
      const electricUrl = env.get('ELECTRIC_URL', 'http://localhost:3000/v1/shape')
      const originUrl = new URL(electricUrl)

      // Get the request URL with query string
      // Note: request.url is a method in AdonisJS, not a property
      const requestUrl = new URL(request.completeUrl(true))

      // Only pass through Electric protocol parameters
      requestUrl.searchParams.forEach((value, key) => {
        if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
          originUrl.searchParams.set(key, value)
        }
      })

      // Server-side shape configuration (security: client cannot override)
      originUrl.searchParams.set('table', 'notifications')

      //
      // Authentication and authorization
      //
      const currentUser = auth.getUserOrFail()

      // If the user isn't set, return 401
      if (!currentUser) {
        return response.status(401).json({
          error: 'Unauthorized',
        })
      }

      // Tenant and user isolation via WHERE clause
      // Only show notifications for the current user in the current tenant
      originUrl.searchParams.set(
        'where',
        `"user_id" = ${currentUser.id} AND "tenant_id" = ${tenant.id}`
      )

      // Add Electric credentials (never exposed to client)
      const sourceId = env.get('ELECTRIC_SOURCE_ID')
      const sourceSecret = env.get('ELECTRIC_SOURCE_SECRET')

      if (sourceId) {
        originUrl.searchParams.set('source_id', sourceId)
      }
      if (sourceSecret) {
        originUrl.searchParams.set('secret', sourceSecret)
      }

      // Fetch from Electric
      const electricResponse = await fetch(originUrl)

      // Get the response body as text (Electric returns JSON or newline-delimited JSON)
      const body = await electricResponse.text()

      // Copy all Electric headers to the AdonisJS response
      // This ensures CORS middleware can process them correctly
      electricResponse.headers.forEach((value, key) => {
        // Skip content-encoding and content-length as fetch decompresses the body
        // but doesn't remove these headers which would break decoding in the browser
        // See https://github.com/whatwg/fetch/issues/1729
        if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
          response.header(key, value)
        }
      })

      // Set the response status and return the body
      // Using AdonisJS response ensures CORS middleware processes the response
      return response.status(electricResponse.status).send(body)
    } catch (error) {
      console.error('Electric proxy error:', error)
      return response.status(500).json({
        error: 'Failed to fetch notifications from Electric',
      })
    }
  }
}
