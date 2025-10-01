import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import wiseService from '#services/wise_service'
import { DateTime } from 'luxon'

export default class WiseAccountsController {
  /**
   * Get user's Wise account information
   */
  async show({ tenant, params, auth, response }: HttpContext) {
    const requestingUser = auth.user!
    const userId = params.id

    // Check permissions: users can only view their own account, or admins can view any
    const isAdmin = await requestingUser.isAdminInTenant(tenant.id)
    if (Number(userId) !== requestingUser.id && !isAdmin) {
      return response.forbidden({
        error: 'You do not have permission to view this Wise account',
      })
    }

    const user = await User.query()
      .where('id', userId)
      .firstOrFail()

    // Return Wise account info (excluding sensitive details for non-owners)
    const wiseInfo = user.getWiseAccountInfo()

    if (!wiseInfo) {
      return response.ok({
        data: null,
        message: 'No Wise account connected',
      })
    }

    // If requesting own account, include full details
    const includeDetails = Number(userId) === requestingUser.id || isAdmin

    return response.ok({
      data: {
        ...wiseInfo,
        accountDetails: includeDetails ? user.wiseAccountDetails : null,
      },
    })
  }

  /**
   * Add or update Wise account information
   */
  async store({ tenant, params, auth, request, response }: HttpContext) {
    const requestingUser = auth.user!
    const userId = params.id

    // Check permissions: users can only update their own account, or admins can update any
    const isAdmin = await requestingUser.isAdminInTenant(tenant.id)
    if (Number(userId) !== requestingUser.id && !isAdmin) {
      return response.forbidden({
        error: 'You do not have permission to update this Wise account',
      })
    }

    const user = await User.query()
      .where('id', userId)
      .firstOrFail()

    const data = request.only([
      'accountHolderName',
      'currency',
      'accountType',
      'country',
      'accountDetails',
    ])

    // Validate required fields
    if (!data.accountHolderName || !data.currency || !data.accountType || !data.country) {
      return response.badRequest({
        error: 'Missing required fields: accountHolderName, currency, accountType, country',
      })
    }

    // Validate account details based on account type
    if (!data.accountDetails || Object.keys(data.accountDetails).length === 0) {
      return response.badRequest({
        error: 'Account details are required',
      })
    }

    try {
      // If Wise service is configured, create recipient in Wise
      let wiseRecipientId = user.wiseRecipientId

      if (wiseService.isConfigured()) {
        try {
          // Create or update recipient in Wise
          const recipient = await wiseService.createRecipient({
            currency: data.currency,
            type: data.accountType,
            accountHolderName: data.accountHolderName,
            details: {
              ...data.accountDetails,
              legalType: 'PRIVATE', // Assuming individual accounts
            },
          })

          wiseRecipientId = recipient.id
        } catch (wiseError: any) {
          console.error('Wise API error:', wiseError)
          // Continue even if Wise API fails - save locally
          // In production, you might want to handle this differently
        }
      }

      // Update user's Wise account information
      user.wiseRecipientId = wiseRecipientId
      user.wiseAccountHolderName = data.accountHolderName
      user.wiseCurrency = data.currency
      user.wiseAccountType = data.accountType
      user.wiseCountry = data.country
      user.wiseAccountDetails = data.accountDetails
      user.wiseVerified = !!wiseRecipientId // Verified if we have a Wise recipient ID
      user.wiseUpdatedAt = DateTime.now()

      if (!user.wiseConnectedAt) {
        user.wiseConnectedAt = DateTime.now()
      }

      await user.save()

      // Log audit event
      console.log(`Wise account ${user.wiseConnectedAt ? 'updated' : 'created'} for user ${user.id}`)

      return response.ok({
        data: {
          ...user.getWiseAccountInfo(),
          accountDetails: data.accountDetails,
        },
        message: 'Wise account saved successfully',
      })
    } catch (error: any) {
      console.error('Error saving Wise account:', error)
      return response.badRequest({
        error: 'Failed to save Wise account',
        details: error.message,
      })
    }
  }

  /**
   * Remove Wise account information
   */
  async destroy({ tenant, params, auth, response }: HttpContext) {
    const requestingUser = auth.user!
    const userId = params.id

    // Check permissions: users can only delete their own account, or admins can delete any
    const isAdmin = await requestingUser.isAdminInTenant(tenant.id)
    if (Number(userId) !== requestingUser.id && !isAdmin) {
      return response.forbidden({
        error: 'You do not have permission to delete this Wise account',
      })
    }

    const user = await User.query()
      .where('id', userId)
      .firstOrFail()

    if (!user.hasWiseAccount()) {
      return response.badRequest({
        error: 'No Wise account to remove',
      })
    }

    // Clear Wise account information
    user.wiseRecipientId = null
    user.wiseAccountHolderName = null
    user.wiseCurrency = null
    user.wiseAccountType = null
    user.wiseCountry = null
    user.wiseAccountDetails = null
    user.wiseVerified = false
    user.wiseConnectedAt = null
    user.wiseUpdatedAt = null

    await user.save()

    // Log audit event
    console.log(`Wise account removed for user ${user.id}`)

    return response.ok({
      message: 'Wise account removed successfully',
    })
  }

  /**
   * Get Wise account requirements for a specific currency/country
   */
  async requirements({ request, response }: HttpContext) {
    const { currency, country } = request.qs()

    if (!currency || !country) {
      return response.badRequest({
        error: 'Currency and country are required',
      })
    }

    // Return account requirements based on currency/country
    // This is a simplified version - in production, you'd fetch this from Wise API
    const requirements = this.getAccountRequirements(currency, country)

    return response.ok({
      data: requirements,
    })
  }

  /**
   * Get account requirements for different currencies/countries
   * In production, this should be fetched from Wise API
   */
  private getAccountRequirements(currency: string, country: string) {
    const requirements: Record<string, any> = {
      USD: {
        accountType: 'aba',
        fields: [
          { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { name: 'routingNumber', label: 'Routing Number', type: 'text', required: true },
          { name: 'accountType', label: 'Account Type', type: 'select', options: ['CHECKING', 'SAVINGS'], required: true },
          { name: 'address', label: 'Address', type: 'object', required: true, fields: [
            { name: 'country', label: 'Country', type: 'text', required: true },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'postCode', label: 'Postal Code', type: 'text', required: true },
            { name: 'firstLine', label: 'Address Line 1', type: 'text', required: true },
          ]},
        ],
      },
      EUR: {
        accountType: 'iban',
        fields: [
          { name: 'iban', label: 'IBAN', type: 'text', required: true },
        ],
      },
      GBP: {
        accountType: 'sort_code',
        fields: [
          { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { name: 'sortCode', label: 'Sort Code', type: 'text', required: true },
        ],
      },
      CAD: {
        accountType: 'canadian',
        fields: [
          { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { name: 'institutionNumber', label: 'Institution Number', type: 'text', required: true },
          { name: 'transitNumber', label: 'Transit Number', type: 'text', required: true },
          { name: 'accountType', label: 'Account Type', type: 'select', options: ['CHECKING', 'SAVINGS'], required: true },
        ],
      },
      AUD: {
        accountType: 'australian',
        fields: [
          { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { name: 'bsbCode', label: 'BSB Code', type: 'text', required: true },
        ],
      },
    }

    return requirements[currency] || {
      accountType: 'email',
      fields: [
        { name: 'email', label: 'Email Address', type: 'email', required: true },
      ],
    }
  }
}

