import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import User from '#models/user'
import Customer from '#models/customer'
import Invoice from '#models/invoice'
import InvoiceItem from '#models/invoice_item'
import Payment from '#models/payment'
import Project from '#models/project'
import Role from '#models/role'
import TenantUser from '#models/tenant_user'
import { DateTime } from 'luxon'

test.group('Invoice PDF Generation', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
  })

  let tenant: Tenant
  let ownerUser: User
  let memberUser: User
  let customer: Customer
  let project: Project
  let invoice: Invoice
  let ownerRole: Role
  let memberRole: Role

  // Helper to generate access token
  const generateToken = async (user: User): Promise<string> => {
    const token = await User.accessTokens.create(user, ['*'], {
      name: 'test-token',
      expiresAt: null,
    })
    return token.value!.release()
  }

  group.each.setup(async () => {
    // Find or create roles
    ownerRole = (await Role.findBy('name', 'owner')) || (await Role.create({ name: 'owner' }))
    memberRole = (await Role.findBy('name', 'member')) || (await Role.create({ name: 'member' }))

    // Create tenant with unique slug
    const uniqueSlug = `test-tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`
    tenant = await Tenant.create({
      name: 'Test Company Inc',
      slug: uniqueSlug,
    })

    // Create owner user with unique email
    const ownerEmail = `owner-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    ownerUser = await User.create({
      email: ownerEmail,
      fullName: 'Owner User',
      password: 'password123',
    })

    // Create member user with unique email
    const memberEmail = `member-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    memberUser = await User.create({
      email: memberEmail,
      fullName: 'Member User',
      password: 'password123',
    })

    // Associate users with tenant
    await TenantUser.create({
      tenantId: tenant.id,
      userId: ownerUser.id,
      roleId: ownerRole.id,
    })

    await TenantUser.create({
      tenantId: tenant.id,
      userId: memberUser.id,
      roleId: memberRole.id,
    })

    // Create customer
    customer = await Customer.create({
      tenantId: tenant.id,
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
      addressLine1: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
      isActive: true,
    })

    // Create project
    project = await Project.create({
      tenantId: tenant.id,
      name: 'Website Redesign',
      description: 'Complete website overhaul',
      status: 'active',
    })

    // Create invoice with complete data
    invoice = await Invoice.create({
      tenantId: tenant.id,
      userId: ownerUser.id,
      customerId: customer.id,
      invoiceNumber: `INV-${Date.now()}`,
      status: 'sent',
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 30 }),
      subtotal: 1000.0,
      taxRate: 10.0,
      taxAmount: 100.0,
      discountAmount: 50.0,
      totalAmount: 1050.0,
      amountPaid: 500.0,
      currency: 'USD',
      clientName: 'Acme Corporation',
      clientEmail: 'billing@acme.com',
      clientAddress: '123 Business St, City, State 12345',
      notes: 'Payment due within 30 days',
      paymentTerms: 'Net 30',
    })

    // Create invoice items
    await InvoiceItem.create({
      invoiceId: invoice.id,
      description: 'Frontend Development',
      quantity: 40,
      unit: 'hours',
      unitPrice: 150.0,
      amount: 600.0,
    })

    await InvoiceItem.create({
      invoiceId: invoice.id,
      description: 'Backend Development',
      quantity: 30,
      unit: 'hours',
      unitPrice: 150.0,
      amount: 450.0,
    })

    // Create a payment
    await Payment.create({
      tenantId: tenant.id,
      invoiceId: invoice.id,
      paymentNumber: `PAY-${Date.now()}`,
      amount: 500.0,
      currency: 'USD',
      paymentDate: DateTime.now(),
      paymentMethod: 'bank_transfer',
      status: 'completed',
      feeAmount: 0,
      netAmount: 500.0,
    })
  })

  group.each.teardown(async () => {
    // Clean up in correct order (child tables first)
    await Payment.query().delete()
    await InvoiceItem.query().delete()
    await Invoice.query().delete()
    await Project.query().delete()
    await Customer.query().delete()
    await TenantUser.query().delete()
    await User.query().delete()
    await Tenant.query().delete()
  })

  test('should generate PDF for invoice with complete data', async ({ client, assert }) => {
    const token = await generateToken(ownerUser)

    const response = await client
      .post(`/api/v1/invoices/${invoice.id}/pdf`)
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.headers()['content-type'], 'application/pdf')
    assert.include(
      response.headers()['content-disposition'],
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    )

    // Verify we got a PDF buffer (should start with PDF magic number %PDF)
    const buffer = response.body()
    assert.isTrue(Buffer.isBuffer(buffer))
    assert.equal(buffer.toString('utf-8', 0, 4), '%PDF')
  })

  test('should generate PDF with all invoice details included', async ({ client, assert }) => {
    const token = await generateToken(ownerUser)

    const response = await client
      .post(`/api/v1/invoices/${invoice.id}/pdf`)
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(token)

    response.assertStatus(200)

    // Verify we got a valid PDF
    const buffer = response.body()
    assert.isTrue(Buffer.isBuffer(buffer))
    assert.equal(buffer.toString('utf-8', 0, 4), '%PDF')

    // Verify PDF contains some text (PDFs embed text in their binary format)
    // We can check for the invoice number which should be in the PDF metadata/content
    const pdfString = buffer.toString('binary')
    assert.isTrue(pdfString.includes(invoice.invoiceNumber))
  })

  test('should generate PDF for invoice without optional data', async ({ client, assert }) => {
    // Create minimal invoice
    const minimalInvoice = await Invoice.create({
      tenantId: tenant.id,
      userId: ownerUser.id,
      invoiceNumber: `INV-MIN-${Date.now()}`,
      status: 'draft',
      issueDate: DateTime.now(),
      dueDate: DateTime.now().plus({ days: 15 }),
      subtotal: 500.0,
      taxRate: 0.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 500.0,
      amountPaid: 0.0,
      currency: 'USD',
    })

    const token = await generateToken(ownerUser)

    const response = await client
      .post(`/api/v1/invoices/${minimalInvoice.id}/pdf`)
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.headers()['content-type'], 'application/pdf')

    const buffer = response.body()
    assert.equal(buffer.toString('utf-8', 0, 4), '%PDF')

    // Clean up
    await minimalInvoice.delete()
  })

  test('should reject PDF generation for non-existent invoice', async ({ client }) => {
    const token = await generateToken(ownerUser)

    const response = await client
      .post(`/api/v1/invoices/999999/pdf`)
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(token)

    // Should return 404 when invoice doesn't exist
    response.assertStatus(404)
  })

  test('should reject PDF generation for invoice from different tenant', async ({
    client,
  }) => {
    // Create another tenant
    const otherTenant = await Tenant.create({
      name: 'Other Company',
      slug: `other-tenant-${Date.now()}`,
    })

    const token = await generateToken(ownerUser)

    const response = await client
      .post(`/api/v1/invoices/${invoice.id}/pdf`)
      .header('x-tenant-slug', otherTenant.slug)
      .bearerToken(token)

    // Should return 403 (forbidden) because user is not owner in other tenant
    // This is more secure than 404 as it doesn't reveal resource existence
    response.assertStatus(403)

    // Clean up
    await otherTenant.delete()
  })

  test('should require owner role for PDF generation', async ({ client }) => {
    const token = await generateToken(memberUser)

    const response = await client
      .post(`/api/v1/invoices/${invoice.id}/pdf`)
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(token)

    response.assertStatus(403)
    response.assertBodyContains({
      message: 'Only tenant owners and admins can export invoices',
    })
  })

  test('should require authentication for PDF generation', async ({ client }) => {
    const response = await client
      .post(`/api/v1/invoices/${invoice.id}/pdf`)
      .header('x-tenant-slug', tenant.slug)

    response.assertStatus(401)
  })

  test('should handle PDF generation errors gracefully', async ({ client, assert }) => {
    // Create an invoice that will cause issues (e.g., malformed data)
    const problematicInvoice = await Invoice.create({
      tenantId: tenant.id,
      userId: ownerUser.id,
      invoiceNumber: `INV-BAD-${Date.now()}`,
      status: 'draft',
      issueDate: DateTime.now(),
      dueDate: DateTime.now(),
      subtotal: 100.0,
      taxRate: 0.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 100.0,
      amountPaid: 0.0,
      currency: 'USD',
    })

    // Even with minimal data, PDF generation should succeed or provide clear error
    const token = await generateToken(ownerUser)

    const response = await client
      .post(`/api/v1/invoices/${problematicInvoice.id}/pdf`)
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(token)

    // Should either succeed or return proper error response
    assert.isTrue(response.status() === 200 || response.status() === 500)

    if (response.status() === 500) {
      response.assertBodyContains({
        error: 'Failed to generate PDF',
      })
    }

    // Clean up
    await problematicInvoice.delete()
  })
})
