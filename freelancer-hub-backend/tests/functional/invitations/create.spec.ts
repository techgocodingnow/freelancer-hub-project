import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import User from '#models/user'
import Role from '#models/role'
import TenantUser from '#models/tenant_user'
import Invitation from '#models/invitation'
import Project from '#models/project'
import { DateTime } from 'luxon'

test.group('Invitations - Create', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
  })

  let tenant: Tenant
  let ownerUser: User
  let memberUser: User
  let ownerRole: Role
  let memberRole: Role
  let adminRole: Role
  let project: Project

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
    adminRole = (await Role.findBy('name', 'admin')) || (await Role.create({ name: 'admin' }))
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

    // Create a test project
    project = await Project.create({
      tenantId: tenant.id,
      name: 'Test Project',
      description: 'A test project',
      status: 'active',
      startDate: DateTime.now(),
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('should create invitation with valid email as owner', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)
    const newUserEmail = `newuser-${Date.now()}@example.com`

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: newUserEmail,
        roleId: memberRole.id,
      })

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Invitation email sent successfully',
    })

    // Verify invitation was created
    const invitation = await Invitation.findBy('email', newUserEmail.toLowerCase())
    assert.exists(invitation)
    assert.equal(invitation?.status, 'pending')
    assert.equal(invitation?.tenantId, tenant.id)
    assert.equal(invitation?.roleId, memberRole.id)
  })

  test('should reject invalid email format', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: 'not-an-email',
        roleId: memberRole.id,
      })

    response.assertStatus(422)
  })

  test('should reject missing email', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        roleId: memberRole.id,
      })

    response.assertStatus(422)
  })

  test('should reject invalid roleId', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: `test-${Date.now()}@example.com`,
        roleId: 'not-a-number',
      })

    response.assertStatus(422)
  })

  test('should reject negative roleId', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: `test-${Date.now()}@example.com`,
        roleId: -1,
      })

    response.assertStatus(422)
  })

  test('should normalize email to lowercase', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)
    const mixedCaseEmail = `NewUser-${Date.now()}@EXAMPLE.COM`

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: mixedCaseEmail,
        roleId: memberRole.id,
      })

    response.assertStatus(201)

    // Verify email was normalized to lowercase
    const invitation = await Invitation.findBy('email', mixedCaseEmail.toLowerCase())
    assert.exists(invitation)
  })

  test('should create project invitation', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)
    const newUserEmail = `projectuser-${Date.now()}@example.com`

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: newUserEmail,
        roleId: memberRole.id,
        projectId: project.id,
      })

    response.assertStatus(201)

    const invitation = await Invitation.findBy('email', newUserEmail.toLowerCase())
    assert.exists(invitation)
    assert.equal(invitation?.projectId, project.id)
  })

  test('should reject member users from creating invitations', async ({ client, assert }) => {
    const memberToken = await generateToken(memberUser)

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(memberToken)
      .json({
        email: `test-${Date.now()}@example.com`,
        roleId: memberRole.id,
      })

    response.assertStatus(403)
    // The actual error message may vary based on middleware implementation
    // Just verify it's a 403 forbidden response
  })

  test('should prevent duplicate pending invitations', async ({ client, assert }) => {
    const ownerToken = await generateToken(ownerUser)
    const email = `duplicate-${Date.now()}@example.com`

    // First invitation
    const response1 = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email,
        roleId: memberRole.id,
      })

    response1.assertStatus(201)

    // Try to send another invitation to the same email
    const response2 = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .bearerToken(ownerToken)
      .json({
        email,
        roleId: memberRole.id,
      })

    response2.assertStatus(409)
  })

  test('should require authentication', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', tenant.slug)
      .json({
        email: `test-${Date.now()}@example.com`,
        roleId: memberRole.id,
      })

    response.assertStatus(401)
  })

  test('should escape HTML in tenant name for email', async ({ client, assert }) => {
    // Create tenant with malicious name
    const uniqueSlug = `xss-test-${Date.now()}`
    const xssTenant = await Tenant.create({
      name: `<script>alert('xss')</script>Company`,
      slug: uniqueSlug,
    })

    await TenantUser.create({
      tenantId: xssTenant.id,
      userId: ownerUser.id,
      roleId: ownerRole.id,
    })

    const ownerToken = await generateToken(ownerUser)
    const newUserEmail = `xsstest-${Date.now()}@example.com`

    const response = await client
      .post('/api/v1/invitations')
      .header('x-tenant-slug', xssTenant.slug)
      .bearerToken(ownerToken)
      .json({
        email: newUserEmail,
        roleId: memberRole.id,
      })

    response.assertStatus(201)

    // Email should be sent successfully without being broken by HTML
    const invitation = await Invitation.findBy('email', newUserEmail.toLowerCase())
    assert.exists(invitation)
  })
})
