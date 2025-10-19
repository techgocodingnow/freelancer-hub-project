import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Tenant from '#models/tenant'
import TenantUser from '#models/tenant_user'
import Role from '#models/role'
import Invitation from '#models/invitation'
import { DateTime } from 'luxon'

test.group('Auth - Registration with Invitation', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('should register new user with valid invitation token', async ({ client, assert }) => {
    // Setup: Create tenant, inviter, role, and invitation
    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Test Company ${timestamp}`,
      slug: `test-company-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@example.com`,
      password: 'password123',
      fullName: 'Test Inviter',
    })

    let memberRole = await Role.findBy('name', 'member')
    if (!memberRole) {
      memberRole = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    let ownerRole = await Role.findBy('name', 'owner')
    if (!ownerRole) {
      ownerRole = await Role.create({
        name: 'owner',
        description: 'Tenant owner',
      })
    }

    await TenantUser.create({
      tenantId: tenant.id,
      userId: inviter.id,
      roleId: ownerRole.id,
    })

    const invitation = await Invitation.createInvitation({
      email: `newuser-${timestamp}@example.com`,
      tenantId: tenant.id,
      roleId: memberRole.id,
      invitedBy: inviter.id,
      expiresInDays: 7,
    })

    // Act: Register with the invitation token
    const response = await client.post('/api/v1/auth/register').json({
      email: `newuser-${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'New User',
      invitationToken: invitation.token,
    })

    // Assert: Registration should succeed
    response.assertStatus(201)

    // Verify user was created
    const user = await User.findBy('email', `newuser-${timestamp}@example.com`)
    assert.exists(user)
    assert.equal(user?.fullName, 'New User')

    // Verify user was added to tenant
    const tenantUser = await TenantUser.query()
      .where('user_id', user!.id)
      .where('tenant_id', tenant.id)
      .first()
    assert.exists(tenantUser)
    assert.equal(tenantUser?.roleId, memberRole.id)

    // Verify invitation was accepted
    await invitation.refresh()
    assert.equal(invitation.status, 'accepted')
    assert.equal(invitation.acceptedBy, user!.id)
    assert.isNotNull(invitation.acceptedAt)
  })

  test('should register new user with project invitation token', async ({ client, assert }) => {
    // Setup: Create tenant, inviter, role, project, and project invitation
    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Test Company ${timestamp}`,
      slug: `test-company-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@example.com`,
      password: 'password123',
      fullName: 'Test Inviter',
    })

    let memberRole = await Role.findBy('name', 'member')
    if (!memberRole) {
      memberRole = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    let ownerRole = await Role.findBy('name', 'owner')
    if (!ownerRole) {
      ownerRole = await Role.create({
        name: 'owner',
        description: 'Tenant owner',
      })
    }

    await TenantUser.create({
      tenantId: tenant.id,
      userId: inviter.id,
      roleId: ownerRole.id,
    })

    // Create a project (importing Project model)
    const { default: Project } = await import('#models/project')
    const project = await Project.create({
      tenantId: tenant.id,
      name: 'Test Project',
      description: 'A test project',
      status: 'active',
      startDate: DateTime.now(),
    })

    const invitation = await Invitation.createInvitation({
      email: `newuser-${timestamp}@example.com`,
      tenantId: tenant.id,
      roleId: memberRole.id,
      invitedBy: inviter.id,
      projectId: project.id,
      expiresInDays: 7,
    })

    // Act: Register with the project invitation token
    const response = await client.post('/api/v1/auth/register').json({
      email: `newuser-${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'New User',
      invitationToken: invitation.token,
    })

    // Assert: Registration should succeed
    response.assertStatus(201)

    // Verify user was created
    const user = await User.findBy('email', `newuser-${timestamp}@example.com`)
    assert.exists(user)

    // Verify user was added to tenant
    const tenantUser = await TenantUser.query()
      .where('user_id', user!.id)
      .where('tenant_id', tenant.id)
      .first()
    assert.exists(tenantUser)

    // Verify user was added to project
    const { default: ProjectMember } = await import('#models/project_member')
    const projectMember = await ProjectMember.query()
      .where('user_id', user!.id)
      .where('project_id', project.id)
      .first()
    assert.exists(projectMember)
    assert.equal(projectMember?.role, 'member')

    // Verify invitation was accepted
    await invitation.refresh()
    assert.equal(invitation.status, 'accepted')
    assert.equal(invitation.acceptedBy, user!.id)
    assert.isNotNull(invitation.acceptedAt)
  })

  test('should reject registration with expired invitation token', async ({ client, assert }) => {
    const timestamp = Date.now()
    const tenant = await Tenant.create({
      name: `Test Company ${timestamp}`,
      slug: `test-company-${timestamp}`,
    })

    const inviter = await User.create({
      email: `inviter-${timestamp}@example.com`,
      password: 'password123',
      fullName: 'Test Inviter',
    })

    let memberRole = await Role.findBy('name', 'member')
    if (!memberRole) {
      memberRole = await Role.create({
        name: 'member',
        description: 'Team member',
      })
    }

    // Create an expired invitation
    const invitation = await Invitation.create({
      email: `newuser-${timestamp}@example.com`,
      token: Invitation.generateToken(),
      tenantId: tenant.id,
      roleId: memberRole.id,
      invitedBy: inviter.id,
      status: 'pending',
      expiresAt: DateTime.now().minus({ days: 1 }), // Expired yesterday
    })

    // Act: Try to register with expired invitation
    const response = await client.post('/api/v1/auth/register').json({
      email: `newuser-${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'New User',
      invitationToken: invitation.token,
    })

    // Assert: Should reject with 400
    response.assertStatus(400)
    response.assertBodyContains({
      error: 'This invitation has expired',
    })

    // Verify user was not created
    const user = await User.findBy('email', `newuser-${timestamp}@example.com`)
    assert.isNull(user)
  })

  test('should reject registration with invalid invitation token', async ({ client, assert }) => {
    const response = await client.post('/api/v1/auth/register').json({
      email: `newuser-${Date.now()}@example.com`,
      password: 'Password123!',
      fullName: 'New User',
      invitationToken: 'invalid-token-12345',
    })

    response.assertStatus(404)
    response.assertBodyContains({
      error: 'Invalid invitation token',
    })
  })
})
