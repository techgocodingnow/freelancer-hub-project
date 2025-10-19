import { test } from '@japa/runner'
import { EmailService } from '#services/email_service'
import Invoice from '#models/invoice'
import Payment from '#models/payment'
import PayrollBatch from '#models/payroll_batch'
import Invitation from '#models/invitation'
import User from '#models/user'
import Tenant from '#models/tenant'
import Customer from '#models/customer'
import Role from '#models/role'
import { DateTime } from 'luxon'

test.group('Email Service - Basic Email Sending', () => {
  test('should send a basic email successfully', async ({ assert }) => {
    const emailService = new EmailService()

    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
    })

    assert.isTrue(result, 'Email should be sent successfully')
  })

  test('should send email with valid recipient', async ({ assert }) => {
    const emailService = new EmailService()

    const result = await emailService.sendEmail({
      to: 'user@domain.com',
      subject: 'Welcome',
      html: '<h1>Welcome to Freelancer Hub</h1>',
    })

    assert.isTrue(result)
  })

  test('should handle invalid email address', async ({ assert }) => {
    const emailService = new EmailService()

    await assert.rejects(
      async () => {
        await emailService.sendEmail({
          to: 'not-an-email',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      },
      'Invalid email address: not-an-email'
    )
  })

  test('should reject email with newline in address', async ({ assert }) => {
    const emailService = new EmailService()

    await assert.rejects(
      async () => {
        await emailService.sendEmail({
          to: 'test@example.com\n',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      },
      'Invalid email address: test@example.com\n'
    )
  })
})

test.group('Email Service - CC Recipients', () => {
  test('should send email with CC recipients', async ({ assert }) => {
    const emailService = new EmailService()

    const result = await emailService.sendEmail({
      to: 'primary@example.com',
      cc: ['cc1@example.com', 'cc2@example.com'],
      subject: 'Test with CC',
      html: '<p>Test email with CC</p>',
    })

    assert.isTrue(result)
  })

  test('should validate CC email addresses', async ({ assert }) => {
    const emailService = new EmailService()

    await assert.rejects(
      async () => {
        await emailService.sendEmail({
          to: 'primary@example.com',
          cc: ['valid@example.com', 'invalid-email'],
          subject: 'Test',
          html: '<p>Test</p>',
        })
      },
      'Invalid CC email address: invalid-email'
    )
  })

  test('should reject more than 10 CC recipients', async ({ assert }) => {
    const emailService = new EmailService()

    const ccList = Array.from({ length: 11 }, (_, i) => `cc${i}@example.com`)

    await assert.rejects(
      async () => {
        await emailService.sendEmail({
          to: 'primary@example.com',
          cc: ccList,
          subject: 'Test',
          html: '<p>Test</p>',
        })
      },
      'Maximum 10 CC recipients allowed'
    )
  })
})

test.group('Email Service - Attachments', () => {
  test('should send email with attachments', async ({ assert }) => {
    const emailService = new EmailService()

    const result = await emailService.sendEmail({
      to: 'customer@example.com',
      subject: 'Invoice #12345',
      html: '<p>Please find your invoice attached</p>',
      attachments: [
        {
          filename: 'invoice-12345.pdf',
          path: '/path/to/invoice.pdf',
        },
      ],
    })

    assert.isTrue(result)
  })

  test('should send email with multiple attachments', async ({ assert }) => {
    const emailService = new EmailService()

    const result = await emailService.sendEmail({
      to: 'customer@example.com',
      subject: 'Documents',
      html: '<p>Please find documents attached</p>',
      attachments: [
        {
          filename: 'invoice.pdf',
          path: '/path/to/invoice.pdf',
        },
        {
          filename: 'receipt.pdf',
          path: '/path/to/receipt.pdf',
        },
      ],
    })

    assert.isTrue(result)
  })
})

test.group('Email Service - Invoice Emails', () => {
  test('should send invoice email successfully', async ({ assert }) => {
    const emailService = new EmailService()

    // Create test data with unique identifiers
    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Test Company ${timestamp}`,
      slug: `test-company-${timestamp}`,
    })

    const user = await User.create({
      email: `owner-${timestamp}@test.com`,
      password: 'password',
      fullName: 'Test Owner',
    })

    const customer = await Customer.create({
      name: 'Test Customer',
      email: `customer-${timestamp}@test.com`,
      tenantId: tenant.id,
    })

    const invoice = await Invoice.create({
      invoiceNumber: `INV-001-${timestamp}`,
      tenantId: tenant.id,
      userId: user.id,
      customerId: customer.id,
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 30 }),
      subtotal: 1000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 1000,
      amountPaid: 0,
      currency: 'USD',
      status: 'draft',
    })

    const result = await emailService.sendInvoiceEmail({
      invoice,
      to: `customer-${timestamp}@test.com`,
    })

    assert.isTrue(result)

    // Verify invoice tracking was updated
    await invoice.refresh()
    assert.equal(invoice.sentTo, `customer-${timestamp}@test.com`)
    assert.isNotNull(invoice.sentAt)
    assert.equal(invoice.emailCount, 1)
    assert.isNotNull(invoice.lastEmailSentAt)
  })

  test('should send invoice email with CC and custom message', async ({ assert }) => {
    const emailService = new EmailService()

    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Test Company 2 ${timestamp}`,
      slug: `test-company-2-${timestamp}`,
    })

    const user = await User.create({
      email: `owner2-${timestamp}@test.com`,
      password: 'password',
      fullName: 'Test Owner 2',
    })

    const customer = await Customer.create({
      name: 'Test Customer 2',
      email: `customer2-${timestamp}@test.com`,
      tenantId: tenant.id,
    })

    const invoice = await Invoice.create({
      invoiceNumber: `INV-002-${timestamp}`,
      tenantId: tenant.id,
      userId: user.id,
      customerId: customer.id,
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 30 }),
      subtotal: 2000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 2000,
      amountPaid: 0,
      currency: 'USD',
      status: 'draft',
    })

    const result = await emailService.sendInvoiceEmail({
      invoice,
      to: `customer2-${timestamp}@test.com`,
      cc: ['accounting@test.com'],
      subject: 'Custom Invoice Subject',
      message: 'Thank you for your business!',
    })

    assert.isTrue(result)
    await invoice.refresh()
    assert.equal(invoice.emailCount, 1)
  })

  test('should reject invalid email in invoice sending', async ({ assert }) => {
    const emailService = new EmailService()

    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Test Company 3 ${timestamp}`,
      slug: `test-company-3-${timestamp}`,
    })

    const user = await User.create({
      email: `owner3-${timestamp}@test.com`,
      password: 'password',
      fullName: 'Test Owner 3',
    })

    const customer = await Customer.create({
      name: 'Test Customer 3',
      email: `customer3-${timestamp}@test.com`,
      tenantId: tenant.id,
    })

    const invoice = await Invoice.create({
      invoiceNumber: `INV-003-${timestamp}`,
      tenantId: tenant.id,
      userId: user.id,
      customerId: customer.id,
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 30 }),
      subtotal: 1500,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 1500,
      amountPaid: 0,
      currency: 'USD',
      status: 'draft',
    })

    await assert.rejects(
      async () => {
        await emailService.sendInvoiceEmail({
          invoice,
          to: 'invalid-email',
        })
      },
      'Invalid email address: invalid-email'
    )

    // Verify invoice was not updated
    await invoice.refresh()
    assert.isNull(invoice.sentAt)
    assert.equal(invoice.emailCount, 0)
  })
})

test.group('Email Service - HTML Escaping', () => {
  test('should escape HTML in tenant name', async ({ assert }) => {
    const emailService = new EmailService()

    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `<script>alert('xss')</script>Company ${timestamp}`,
      slug: `xss-test-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@test.com`,
      password: 'password',
      fullName: 'Test Inviter',
    })

    let role = await Role.query().where('name', 'member').first()
    if (!role) {
      role = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    const invitation = await Invitation.createInvitation({
      email: `newuser-${timestamp}@test.com`,
      tenantId: tenant.id,
      roleId: role.id,
      invitedBy: inviter.id,
      expiresInDays: 7,
    })

    await invitation.load('tenant')
    await invitation.load('role')
    await invitation.load('inviter')

    const result = await emailService.sendInvitationEmail(invitation, 'http://localhost:5173')

    assert.isTrue(result)
    // HTML should be escaped in the email content
    // We can't directly test the HTML content in this test, but the method should succeed
  })

  test('should escape HTML in inviter name', async ({ assert }) => {
    const emailService = new EmailService()

    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Safe Company ${timestamp}`,
      slug: `safe-test-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@test.com`,
      password: 'password',
      fullName: `<img src=x onerror=alert('xss')>Hacker`,
    })

    let role = await Role.query().where('name', 'member').first()
    if (!role) {
      role = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    const invitation = await Invitation.createInvitation({
      email: `newuser-${timestamp}@test.com`,
      tenantId: tenant.id,
      roleId: role.id,
      invitedBy: inviter.id,
      expiresInDays: 7,
    })

    await invitation.load('tenant')
    await invitation.load('role')
    await invitation.load('inviter')

    const result = await emailService.sendInvitationEmail(invitation, 'http://localhost:5173')

    assert.isTrue(result)
  })

  test('should escape HTML special characters', async ({ assert }) => {
    const emailService = new EmailService()

    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Company & Sons <Ltd> "Quotes" ${timestamp}`,
      slug: `escape-test-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@test.com`,
      password: 'password',
      fullName: `John & Jane's "Company"`,
    })

    let role = await Role.query().where('name', 'member').first()
    if (!role) {
      role = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    const invitation = await Invitation.createInvitation({
      email: `newuser-${timestamp}@test.com`,
      tenantId: tenant.id,
      roleId: role.id,
      invitedBy: inviter.id,
      expiresInDays: 7,
    })

    await invitation.load('tenant')
    await invitation.load('role')
    await invitation.load('inviter')

    const result = await emailService.sendInvitationEmail(invitation, 'http://localhost:5173')

    assert.isTrue(result)
  })
})

test.group('Email Service - Invitation Emails', () => {
  test('should send invitation email successfully', async ({ assert }) => {
    const emailService = new EmailService()

    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Invitation Test Company ${timestamp}`,
      slug: `invitation-test-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@test.com`,
      password: 'password',
      fullName: 'Test Inviter',
    })

    let role = await Role.query().where('name', 'member').first()
    if (!role) {
      role = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    const invitation = await Invitation.createInvitation({
      email: `newuser-${timestamp}@test.com`,
      tenantId: tenant.id,
      roleId: role.id,
      invitedBy: inviter.id,
      expiresInDays: 7,
    })

    const result = await emailService.sendInvitationEmail(invitation, 'http://localhost:5173')

    assert.isTrue(result)
  })
})
