import env from '#start/env'

export interface WiseQuote {
  id: string
  sourceCurrency: string
  targetCurrency: string
  sourceAmount: number
  targetAmount: number
  rate: number
  fee: number
}

export interface WiseRecipient {
  id: number
  accountHolderName: string
  currency: string
  country: string
  type: string
  details: any
}

export interface WiseTransfer {
  id: number
  user: number
  targetAccount: number
  quoteUuid: string
  customerTransactionId: string
  status: string
  reference: string
  rate: number
  created: string
}

export class WiseService {
  private apiKey: string
  private baseUrl: string
  private profileId: string | null

  constructor() {
    this.apiKey = env.get('WISE_API_KEY', '')
    this.profileId = env.get('WISE_PROFILE_ID', null)
    const environment = env.get('WISE_ENVIRONMENT', 'sandbox')
    this.baseUrl =
      environment === 'production'
        ? 'https://api.transferwise.com'
        : 'https://api.sandbox.transferwise.tech'
  }

  /**
   * Check if Wise is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.profileId
  }

  /**
   * Create a quote for currency conversion
   */
  async createQuote(
    sourceCurrency: string,
    targetCurrency: string,
    sourceAmount: number
  ): Promise<WiseQuote> {
    if (!this.isConfigured()) {
      throw new Error('Wise API is not configured')
    }

    const response = await fetch(`${this.baseUrl}/v3/quotes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceCurrency,
        targetCurrency,
        sourceAmount,
        targetAmount: null,
        profile: this.profileId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      id: data.id,
      sourceCurrency: data.sourceCurrency,
      targetCurrency: data.targetCurrency,
      sourceAmount: data.sourceAmount,
      targetAmount: data.targetAmount,
      rate: data.rate,
      fee: data.fee,
    }
  }

  /**
   * Create a recipient account
   */
  async createRecipient(recipientData: {
    currency: string
    type: string
    accountHolderName: string
    details: any
  }): Promise<WiseRecipient> {
    if (!this.isConfigured()) {
      throw new Error('Wise API is not configured')
    }

    const response = await fetch(`${this.baseUrl}/v1/accounts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: this.profileId,
        ...recipientData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create a transfer
   */
  async createTransfer(
    targetAccount: number,
    quoteUuid: string,
    customerTransactionId: string,
    reference: string
  ): Promise<WiseTransfer> {
    if (!this.isConfigured()) {
      throw new Error('Wise API is not configured')
    }

    const response = await fetch(`${this.baseUrl}/v1/transfers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetAccount,
        quoteUuid,
        customerTransactionId,
        details: {
          reference,
          transferPurpose: 'verification.transfers.purpose.pay.bills',
          sourceOfFunds: 'verification.source.of.funds.salary',
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Fund a transfer
   */
  async fundTransfer(transferId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Wise API is not configured')
    }

    const response = await fetch(
      `${this.baseUrl}/v3/profiles/${this.profileId}/transfers/${transferId}/payments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'BALANCE',
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Wise API is not configured')
    }

    const response = await fetch(`${this.baseUrl}/v1/transfers/${transferId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Cancel a transfer
   */
  async cancelTransfer(transferId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Wise API is not configured')
    }

    const response = await fetch(`${this.baseUrl}/v1/transfers/${transferId}/cancel`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Simulate transfer completion (sandbox only)
   */
  async simulateTransferCompletion(transferId: number): Promise<any> {
    if (env.get('WISE_ENVIRONMENT') !== 'sandbox') {
      throw new Error('This method is only available in sandbox mode')
    }

    const response = await fetch(
      `${this.baseUrl}/v1/simulation/transfers/${transferId}/processing`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Wise API error: ${response.statusText}`)
    }

    return await response.json()
  }
}

export default new WiseService()

