import { test } from '@japa/runner'
import { createInvoiceValidator } from '#validators/invoices'

test.group('Invoice Validator', () => {
  test('should validate valid invoice data with 1 week duration', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          description: 'Web Development Services',
          quantity: 40,
          unitPrice: 100,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.equal(validated.customerId, 1)
    assert.equal(validated.duration, '1week')
    assert.lengthOf(validated.items || [], 1)
    assert.equal(validated.items?.[0].description, 'Web Development Services')
    assert.equal(validated.items?.[0].quantity, 40)
    assert.equal(validated.items?.[0].unitPrice, 100)
  })

  test('should validate valid invoice data with 2 weeks duration', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '2weeks',
      items: [
        {
          description: 'Monthly Retainer',
          quantity: 1,
          unitPrice: 5000,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.equal(validated.duration, '2weeks')
  })

  test('should validate valid invoice data with 1 month duration', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1month',
      items: [
        {
          description: 'Monthly Retainer',
          quantity: 1,
          unitPrice: 10000,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.equal(validated.duration, '1month')
  })

  test('should validate multiple items', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          description: 'Service A',
          quantity: 10,
          unitPrice: 100,
        },
        {
          description: 'Service B',
          quantity: 5,
          unitPrice: 200,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.lengthOf(validated.items || [], 2)
  })

  test('should accept missing customerId if duration and items provided', async ({ assert }) => {
    const data = {
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.isUndefined(validated.customerId)
    assert.lengthOf(validated.items || [], 1)
  })

  test('should reject invalid duration', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: 'invalid',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject empty items array', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject items without description', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject negative quantity', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: -1,
          unitPrice: 100,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject zero quantity', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: 0,
          unitPrice: 100,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject negative unit price', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: -100,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject zero unit price', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  test('should reject missing items', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })

  // New tests for optional fields
  test('should accept optional projectId', async ({ assert }) => {
    const data = {
      customerId: 1,
      projectId: 5,
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.equal(validated.projectId, 5)
  })

  test('should accept optional projectId', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: '1week',
      projectId: 5,
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.equal(validated.projectId, 5)
  })

  test('should accept projectId without customerId', async ({ assert }) => {
    const data = {
      projectId: 5,
      duration: '1week',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    const validated = await createInvoiceValidator.validate(data)

    assert.equal(validated.projectId, 5)
    assert.isUndefined(validated.customerId)
  })

  test('should reject invalid duration', async ({ assert }) => {
    const data = {
      customerId: 1,
      duration: 'invalid',
      items: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        },
      ],
    }

    await assert.rejects(async () => {
      await createInvoiceValidator.validate(data)
    })
  })
})
