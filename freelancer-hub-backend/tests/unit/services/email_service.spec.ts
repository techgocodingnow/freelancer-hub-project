import { test } from '@japa/runner'
import { EmailService } from '#services/email_service'

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
