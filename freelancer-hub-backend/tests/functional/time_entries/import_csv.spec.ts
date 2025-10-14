import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import User from '#models/user'
import Project from '#models/project'
import Task from '#models/task'
import TimeEntry from '#models/time_entry'
import Role from '#models/role'
import TenantUser from '#models/tenant_user'

test.group('Time Entries CSV Import', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
  })

  let tenant: Tenant
  let user: User
  let adminUser: User
  let project: Project
  let task: Task
  let memberRole: Role
  let adminRole: Role

  group.each.setup(async () => {
    // Find or create roles
    memberRole =
      (await Role.findBy('name', 'member')) || (await Role.create({ name: 'member' }))
    adminRole = (await Role.findBy('name', 'admin')) || (await Role.create({ name: 'admin' }))

    // Create tenant with unique slug
    const uniqueSlug = `test-tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`
    tenant = await Tenant.create({
      name: 'Test Tenant',
      slug: uniqueSlug,
    })

    // Create regular user with unique email
    const userEmail = `user-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    user = await User.create({
      email: userEmail,
      fullName: 'Test User',
      password: 'password123',
    })

    // Create admin user with unique email
    const adminEmail = `admin-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    adminUser = await User.create({
      email: adminEmail,
      fullName: 'Admin User',
      password: 'password123',
    })

    // Associate users with tenant
    await TenantUser.create({
      tenantId: tenant.id,
      userId: user.id,
      roleId: memberRole.id,
    })

    await TenantUser.create({
      tenantId: tenant.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    })

    // Create project and task
    project = await Project.create({
      tenantId: tenant.id,
      name: 'Test Project',
      description: 'Test project description',
      status: 'active',
    })

    task = await Task.create({
      projectId: project.id,
      title: 'Test Task',
      description: 'Test task description',
      status: 'in_progress',
      estimatedHours: 10,
      actualHours: 0,
      createdBy: user.id, // Add required field
    })
  })

  group.each.teardown(async () => {
    // Clean up time entries first (child tables)
    await TimeEntry.query().delete()
    await Task.query().delete()
    await Project.query().delete()
    await TenantUser.query().delete()
    await User.query().delete()
    await Tenant.query().delete()
    // Don't delete roles as they're shared across tests
  })

  test('should successfully import valid CSV file with time entries', async ({ client, assert }) => {
    // Prepare CSV content
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
2025-10-14,Test Project,Test Task,09:00,12:00,,Fixed authentication bug,Reviewed with team,Yes
2025-10-14,Test Project,Test Task,,,120,Wrote unit tests,,Yes`

    // Create a file buffer
    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      imported: 2,
      failed: 0,
    })

    // Verify entries were created in database
    const entries = await TimeEntry.query().where('user_id', user.id)
    assert.lengthOf(entries, 2)

    // Verify first entry
    assert.equal(entries[0].taskId, task.id)
    assert.equal(entries[0].durationMinutes, 180) // 3 hours
    assert.equal(entries[0].description, 'Fixed authentication bug')
    assert.equal(entries[0].notes, 'Reviewed with team')
    assert.isTrue(entries[0].billable)

    // Verify second entry
    assert.equal(entries[1].durationMinutes, 120)
    assert.equal(entries[1].description, 'Wrote unit tests')
    assert.isTrue(entries[1].billable)

    // Verify task actual hours were updated
    await task.refresh()
    assert.equal(task.actualHours, 5) // 180 + 120 = 300 minutes = 5 hours
  })

  test('should reject CSV with invalid date format', async ({ client, assert }) => {
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
invalid-date,Test Project,Test Task,09:00,12:00,,Fixed bug,,Yes`

    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      errors: [
        {
          row: 2,
          field: 'date',
        },
      ],
    })

    // Verify no entries were created
    const entries = await TimeEntry.query().where('user_id', user.id)
    assert.lengthOf(entries, 0)
  })

  test('should reject CSV with missing required fields', async ({ client, assert }) => {
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
2025-10-14,Test Project,Test Task,,,,,Yes`

    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      errors: [
        {
          row: 2,
          field: 'description',
        },
      ],
    })

    const entries = await TimeEntry.query().where('user_id', user.id)
    assert.lengthOf(entries, 0)
  })

  test('should reject CSV with non-existent project', async ({ client, assert }) => {
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
2025-10-14,Non Existent Project,Test Task,09:00,12:00,,Fixed bug,,Yes`

    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      errors: [
        {
          row: 2,
          field: 'project',
          message: 'Project not found',
        },
      ],
    })

    const entries = await TimeEntry.query().where('user_id', user.id)
    assert.lengthOf(entries, 0)
  })

  test('should reject CSV with non-existent task', async ({ client, assert }) => {
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
2025-10-14,Test Project,Non Existent Task,09:00,12:00,,Fixed bug,,Yes`

    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(422)
    response.assertBodyContains({
      success: false,
      errors: [
        {
          row: 2,
          field: 'task',
          message: 'Task not found in project',
        },
      ],
    })

    const entries = await TimeEntry.query().where('user_id', user.id)
    assert.lengthOf(entries, 0)
  })

  test('should require authentication', async ({ client }) => {
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
2025-10-14,Test Project,Test Task,09:00,12:00,,Fixed bug,,Yes`

    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(401)
  })

  test('should reject if CSV file is missing', async ({ client }) => {
    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          message: 'CSV file is required',
        },
      ],
    })
  })

  test('should handle mixed valid and invalid rows with partial import option', async ({
    client,
    assert,
  }) => {
    const csvContent = `Date,Project,Task,Start Time,End Time,Duration (minutes),Description,Notes,Billable
2025-10-14,Test Project,Test Task,09:00,12:00,,Valid entry 1,,Yes
invalid-date,Test Project,Test Task,,,120,Invalid entry,,Yes
2025-10-14,Test Project,Test Task,,,60,Valid entry 2,,No`

    const csvBuffer = Buffer.from(csvContent, 'utf-8')

    const response = await client
      .post(`/api/v1/time-entries/import`)
      .header('x-tenant-slug', tenant.slug)
      .loginAs(user)
      .field('skipInvalid', 'true')
      .file('csv', csvBuffer, { filename: 'time-entries.csv' })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      imported: 2,
      failed: 1,
      errors: [
        {
          row: 3,
          field: 'date',
        },
      ],
    })

    // Verify only valid entries were created
    const entries = await TimeEntry.query().where('user_id', user.id)
    assert.lengthOf(entries, 2)
  })
})
