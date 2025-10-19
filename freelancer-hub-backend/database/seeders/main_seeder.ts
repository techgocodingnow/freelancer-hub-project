import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Tenant from '#models/tenant'
import User from '#models/user'
import Customer from '#models/customer'
import Position from '#models/position'
import Project from '#models/project'
import ProjectMember from '#models/project_member'
import Task from '#models/task'
import TimeEntry from '#models/time_entry'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    console.log('🌱 Starting database seeding...')

    // Create Tenants
    console.log('📦 Creating tenants...')
    const tenants = await this.createTenants()

    // Create Users
    console.log('👥 Creating users...')
    const users = await this.createUsers(tenants)

    // Create Customers
    console.log('🏢 Creating customers...')
    const customers = await this.createCustomers(tenants)

    // Create Positions
    console.log('🏷️  Creating positions...')
    const positions = await this.createPositions(tenants)

    // Create Projects
    console.log('📁 Creating projects...')
    const projects = await this.createProjects(tenants, users, customers, positions)

    // Create Project Members
    console.log('👨‍💼 Adding project members...')
    await this.createProjectMembers(projects, users, positions)

    // Create Tasks
    console.log('✅ Creating tasks...')
    const tasks = await this.createTasks(projects, users)

    // Create Time Entries
    console.log('⏱️  Creating time entries...')
    await this.createTimeEntries(tasks, users)

    console.log('✨ Seeding completed successfully!')
    console.log('\n📋 Seeded Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Tenant: Acme Corp (slug: acme-corp)')
    console.log('  👤 tech+01@gocodingnow.com / Test@123! (Owner)')
    console.log('  👤 tech+02@gocodingnow.com / Test@123! (Admin)')
    console.log('')
    console.log('Tenant: Tech Solutions (slug: tech-solutions)')
    console.log('  👤 tech+03@gocodingnow.com / Test@123! (Owner)')
    console.log('  👤 tech+04@gocodingnow.com / Test@123! (Member)')
    console.log('  👤 tech+05@gocodingnow.com / Test@123! (Viewer - Multi-tenant)')
    console.log('')
    console.log('Tenant: Design Studio (slug: design-studio)')
    console.log('  👤 tech+06@gocodingnow.com / Test@123! (Owner)')
    console.log('  👤 tech+07@gocodingnow.com / Test@123! (Admin - Multi-tenant)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }

  private async createTenants() {
    const tenantsData = [
      {
        name: 'Acme Corp',
        slug: 'acme-corp',
        description: 'Leading provider of innovative solutions',
        isActive: true,
      },
      {
        name: 'Tech Solutions',
        slug: 'tech-solutions',
        description: 'Technology consulting and development',
        isActive: true,
      },
      {
        name: 'Design Studio',
        slug: 'design-studio',
        description: 'Creative design and branding agency',
        isActive: true,
      },
    ]

    const tenants: { [key: string]: Tenant } = {}

    for (const data of tenantsData) {
      // Check if tenant already exists
      let tenant = await Tenant.query().where('slug', data.slug).first()

      if (!tenant) {
        tenant = await Tenant.create(data)
        console.log(`  ✓ Created tenant: ${data.name}`)
      } else {
        console.log(`  ⚠ Tenant already exists: ${data.name}`)
      }

      tenants[data.slug] = tenant
    }

    return tenants
  }

  private async createUsers(tenants: { [key: string]: Tenant }) {
    // Get role IDs from the roles table
    const roles = await db.from('roles').select('id', 'name')
    const roleMap = new Map(roles.map((r) => [r.name, r.id]))

    // Define users (without tenant association - that comes later)
    const usersData = [
      {
        fullName: 'Tech+01',
        email: 'tech+01@gocodingnow.com',
        password: 'Test@123!',
      },
      {
        fullName: 'Tech+02',
        email: 'tech+02@gocodingnow.com',
        password: 'Test@123!',
      },
      {
        fullName: 'Jane Smith',
        email: 'tech+03@gocodingnow.com',
        password: 'Test@123!',
      },
      {
        fullName: 'Mike Wilson',
        email: 'tech+04@gocodingnow.com',
        password: 'Test@123!',
      },
      {
        fullName: 'Alex Martinez',
        email: 'tech+05@gocodingnow.com',
        password: 'Test@123!',
      },
      {
        fullName: 'Tech+06',
        email: 'tech+06@gocodingnow.com',
        password: 'Test@123!',
      },
      {
        fullName: 'Tech+07',
        email: 'tech+07@gocodingnow.com',
        password: 'Test@123!',
      },
    ]

    const users: { [key: string]: User } = {}

    // Create users
    for (const data of usersData) {
      let user = await User.query().where('email', data.email).first()

      if (!user) {
        user = await User.create({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        })
        console.log(`  ✓ Created user: ${data.email}`)
      } else {
        console.log(`  ⚠ User already exists: ${data.email}`)
      }

      users[data.email] = user
    }

    // Create tenant-user relationships with roles
    const tenantUserData = [
      // Acme Corp
      {
        userEmail: 'tech+01@gocodingnow.com',
        tenantSlug: 'acme-corp',
        roleName: 'owner',
      },
      {
        userEmail: 'tech+02@gocodingnow.com',
        tenantSlug: 'acme-corp',
        roleName: 'admin',
      },
      // Tech Solutions
      {
        userEmail: 'tech+03@gocodingnow.com',
        tenantSlug: 'tech-solutions',
        roleName: 'owner',
      },
      {
        userEmail: 'tech+04@gocodingnow.com',
        tenantSlug: 'tech-solutions',
        roleName: 'member',
      },
      // Design Studio
      {
        userEmail: 'tech+05@gocodingnow.com',
        tenantSlug: 'design-studio',
        roleName: 'owner',
      },
      // Multi-tenant users (demonstrating the new capability)
      {
        userEmail: 'tech+06@gocodingnow.com',
        tenantSlug: 'tech-solutions',
        roleName: 'viewer',
      },
      {
        userEmail: 'tech+07@gocodingnow.com',
        tenantSlug: 'design-studio',
        roleName: 'admin',
      },
    ]

    for (const data of tenantUserData) {
      const user = users[data.userEmail]
      const tenant = tenants[data.tenantSlug]
      const roleId = roleMap.get(data.roleName)

      if (!user || !tenant || !roleId) {
        console.log(
          `  ⚠ Skipping tenant-user relationship: ${data.userEmail} - ${data.tenantSlug}`
        )
        continue
      }

      // Check if relationship already exists
      const existing = await db
        .from('tenant_users')
        .where('user_id', user.id)
        .where('tenant_id', tenant.id)
        .first()

      if (!existing) {
        await db.table('tenant_users').insert({
          user_id: user.id,
          tenant_id: tenant.id,
          role_id: roleId,
          is_active: true,
          joined_at: new Date(),
          created_at: new Date(),
        })
        console.log(`  ✓ Added ${data.userEmail} to ${data.tenantSlug} as ${data.roleName}`)
      }
    }

    return users
  }

  private async createCustomers(tenants: { [key: string]: Tenant }) {
    const customersData = [
      // Acme Corp customers
      {
        tenantSlug: 'acme-corp',
        name: 'TechStart Inc',
        email: 'tech+customer01@gocodingnow.com',
        phone: '+1 555-0100',
        company: 'TechStart Inc',
        addressLine1: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        notes: 'Early-stage startup, very responsive',
      },
      {
        tenantSlug: 'acme-corp',
        name: 'Global Retail Corp',
        email: 'tech+customer02@gocodingnow.com',
        phone: '+1 555-0200',
        company: 'Global Retail Corp',
        addressLine1: '456 Commerce Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        notes: 'Large enterprise client, requires detailed reporting',
      },
      // Tech Solutions customers
      {
        tenantSlug: 'tech-solutions',
        name: 'Healthcare Solutions Ltd',
        email: 'tech+customer03@gocodingnow.com',
        phone: '+1 555-0300',
        company: 'Healthcare Solutions Ltd',
        addressLine1: '789 Medical Plaza',
        city: 'Boston',
        state: 'MA',
        postalCode: '02108',
        country: 'USA',
        notes: 'Healthcare industry, strict compliance requirements',
      },
      // Design Studio customers
      {
        tenantSlug: 'design-studio',
        name: 'Bright Future Startup',
        email: 'tech+customer04@gocodingnow.com',
        phone: '+1 555-0400',
        company: 'Bright Future',
        addressLine1: '321 Startup Lane',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
        notes: 'New client, referred by previous customer',
      },
    ]

    const customers: { [key: string]: Customer } = {}

    for (const data of customersData) {
      const tenant = tenants[data.tenantSlug]

      // Check if customer already exists
      let customer = await Customer.query()
        .where('tenant_id', tenant.id)
        .where('email', data.email)
        .first()

      if (!customer) {
        customer = await Customer.create({
          tenantId: tenant.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          addressLine1: data.addressLine1,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          notes: data.notes,
          isActive: true,
        })
        console.log(`  ✓ Created customer: ${data.name}`)
      } else {
        console.log(`  ⚠ Customer already exists: ${data.name}`)
      }

      customers[data.email] = customer
    }

    return customers
  }

  private async createPositions(tenants: { [key: string]: Tenant }) {
    const positionsData = [
      'Project Manager',
      'Technical Lead',
      'Senior Developer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Designer',
      'QA Engineer',
      'DevOps Engineer',
      'Product Owner',
    ]

    const positions: { [key: string]: { [key: string]: Position } } = {}

    for (const [tenantSlug, tenant] of Object.entries(tenants)) {
      positions[tenantSlug] = {}

      for (const positionName of positionsData) {
        // Check if position already exists
        let position = await Position.query()
          .where('tenant_id', tenant.id)
          .where('name', positionName)
          .first()

        if (!position) {
          position = await Position.create({
            tenantId: tenant.id,
            name: positionName,
            description: null,
            isActive: true,
          })
          console.log(`  ✓ Created position for ${tenantSlug}: ${positionName}`)
        } else {
          console.log(`  ⚠ Position already exists for ${tenantSlug}: ${positionName}`)
        }

        positions[tenantSlug][positionName] = position
      }
    }

    return positions
  }

  private async createProjects(
    tenants: { [key: string]: Tenant },
    users: { [key: string]: User },
    customers: { [key: string]: Customer },
    positions: { [key: string]: { [key: string]: Position } }
  ) {
    const projectsData = [
      // Acme Corp projects
      {
        tenantSlug: 'acme-corp',
        ownerEmail: 'tech+01@gocodingnow.com',
        customerEmail: 'tech+customer01@gocodingnow.com',
        name: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        status: 'active' as const,
        startDate: DateTime.now().minus({ days: 30 }),
        endDate: DateTime.now().plus({ days: 60 }),
        budget: 50000,
      },
      {
        tenantSlug: 'acme-corp',
        ownerEmail: 'tech+02@gocodingnow.com',
        customerEmail: 'tech+customer02@gocodingnow.com',
        name: 'Mobile App Development',
        description: 'Native mobile app for iOS and Android',
        status: 'active' as const,
        startDate: DateTime.now().minus({ days: 15 }),
        endDate: DateTime.now().plus({ days: 90 }),
        budget: 120000,
      },
      // Tech Solutions projects
      {
        tenantSlug: 'tech-solutions',
        ownerEmail: 'tech+03@gocodingnow.com',
        customerEmail: 'tech+customer03@gocodingnow.com',
        name: 'CRM System',
        description: 'Custom CRM system for client management',
        status: 'active' as const,
        startDate: DateTime.now().minus({ days: 45 }),
        endDate: DateTime.now().plus({ days: 45 }),
        budget: 80000,
      },
      // Design Studio projects
      {
        tenantSlug: 'design-studio',
        ownerEmail: 'tech+06@gocodingnow.com',
        customerEmail: 'tech+customer04@gocodingnow.com',
        name: 'Brand Identity',
        description: 'Complete brand identity package for startup',
        status: 'active' as const,
        startDate: DateTime.now().minus({ days: 10 }),
        endDate: DateTime.now().plus({ days: 30 }),
        budget: 25000,
      },
    ]

    const projects: Project[] = []

    for (const data of projectsData) {
      const tenant = tenants[data.tenantSlug]
      const owner = users[data.ownerEmail]
      const customer = customers[data.customerEmail]

      // Check if project already exists
      const existing = await Project.query()
        .where('tenant_id', tenant.id)
        .where('name', data.name)
        .first()

      if (!existing) {
        const project = await Project.create({
          tenantId: tenant.id,
          customerId: customer?.id,
          name: data.name,
          description: data.description,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
        })

        // Add owner as project member
        const pmPosition = positions[data.tenantSlug]['Project Manager']
        await ProjectMember.create({
          projectId: project.id,
          userId: owner.id,
          role: 'owner',
          positionId: pmPosition?.id || null,
          joinedAt: DateTime.now(),
        })

        projects.push(project)
        console.log(`  ✓ Created project: ${data.name}`)
      } else {
        projects.push(existing)
        console.log(`  ⚠ Project already exists: ${data.name}`)
      }
    }

    return projects
  }

  private async createProjectMembers(
    projects: Project[],
    users: { [key: string]: User },
    positions: { [key: string]: { [key: string]: Position } }
  ) {
    // Add additional members to projects
    const memberships = [
      {
        projectIndex: 0,
        tenantSlug: 'acme-corp',
        email: 'sarah@acme-corp.com',
        role: 'admin' as const,
        positionName: 'Technical Lead',
        hourlyRate: 30,
      },
      {
        projectIndex: 1,
        tenantSlug: 'acme-corp',
        email: 'john@acme-corp.com',
        role: 'member' as const,
        positionName: 'Senior Developer',
        hourlyRate: 30,
      },
      {
        projectIndex: 2,
        tenantSlug: 'tech-solutions',
        email: 'mike@tech-solutions.com',
        role: 'member' as const,
        positionName: 'Frontend Developer',
        hourlyRate: 30,
      },
    ]

    for (const membership of memberships) {
      const project = projects[membership.projectIndex]
      const user = users[membership.email]
      const position = positions[membership.tenantSlug][membership.positionName]

      if (project && user) {
        const existing = await ProjectMember.query()
          .where('project_id', project.id)
          .where('user_id', user.id)
          .first()

        if (!existing) {
          await ProjectMember.create({
            projectId: project.id,
            userId: user.id,
            role: membership.role,
            positionId: position?.id || null,
            joinedAt: DateTime.now(),
            hourlyRate: membership.hourlyRate,
          })
          console.log(
            `  ✓ Added ${user.email} to project as ${membership.role} (${membership.positionName})`
          )
        }
      }
    }
  }

  private async createTasks(projects: Project[], users: { [key: string]: User }) {
    const tasksData = [
      // Website Redesign tasks (Project 0)
      {
        projectIndex: 0,
        title: 'Design homepage mockup',
        description: 'Create initial design mockups for the homepage',
        status: 'done' as const,
        priority: 'high' as const,
        assigneeEmail: 'tech+02@gocodingnow.com',
        creatorEmail: 'tech+01@gocodingnow.com',
        dueDate: DateTime.now().minus({ days: 5 }),
        estimatedHours: 8,
        actualHours: 10,
        position: 1,
      },
      {
        projectIndex: 0,
        title: 'Develop frontend components',
        description: 'Build reusable React components for the new design',
        status: 'in_progress' as const,
        priority: 'high' as const,
        assigneeEmail: 'tech+02@gocodingnow.com',
        creatorEmail: 'tech+01@gocodingnow.com',
        dueDate: DateTime.now().plus({ days: 7 }),
        estimatedHours: 40,
        actualHours: 15,
        position: 2,
      },
      {
        projectIndex: 0,
        title: 'Write unit tests',
        description: 'Create comprehensive unit tests for all components',
        status: 'todo' as const,
        priority: 'medium' as const,
        assigneeEmail: 'tech+02@gocodingnow.com',
        creatorEmail: 'tech+01@gocodingnow.com',
        dueDate: DateTime.now().plus({ days: 14 }),
        estimatedHours: 16,
        actualHours: 0,
        position: 3,
      },
      // Mobile App tasks (Project 1)
      {
        projectIndex: 1,
        title: 'Setup React Native project',
        description: 'Initialize React Native project with required dependencies',
        status: 'done' as const,
        priority: 'urgent' as const,
        assigneeEmail: 'tech+02@gocodingnow.com',
        creatorEmail: 'tech+01@gocodingnow.com',
        dueDate: DateTime.now().minus({ days: 10 }),
        estimatedHours: 4,
        actualHours: 5,
        position: 1,
      },
      {
        projectIndex: 1,
        title: 'Implement authentication',
        description: 'Add user authentication with JWT tokens',
        status: 'in_progress' as const,
        priority: 'high' as const,
        assigneeEmail: 'tech+02@gocodingnow.com',
        creatorEmail: 'tech+01@gocodingnow.com',
        dueDate: DateTime.now().plus({ days: 5 }),
        estimatedHours: 20,
        actualHours: 12,
        position: 2,
      },
      // CRM System tasks (Project 2)
      {
        projectIndex: 2,
        title: 'Database schema design',
        description: 'Design database schema for CRM system',
        status: 'done' as const,
        priority: 'high' as const,
        assigneeEmail: 'tech+03@gocodingnow.com',
        creatorEmail: 'tech+03@gocodingnow.com',
        dueDate: DateTime.now().minus({ days: 20 }),
        estimatedHours: 12,
        actualHours: 14,
        position: 1,
      },
      {
        projectIndex: 2,
        title: 'Build API endpoints',
        description: 'Create RESTful API endpoints for CRM operations',
        status: 'review' as const,
        priority: 'high' as const,
        assigneeEmail: 'tech+03@gocodingnow.com',
        creatorEmail: 'tech+03@gocodingnow.com',
        dueDate: DateTime.now().plus({ days: 3 }),
        estimatedHours: 30,
        actualHours: 28,
        position: 2,
      },
    ]

    const tasks: Task[] = []

    for (const data of tasksData) {
      const project = projects[data.projectIndex]
      if (!project) continue

      const assignee = users[data.assigneeEmail]
      const creator = users[data.creatorEmail]

      const existing = await Task.query()
        .where('project_id', project.id)
        .where('title', data.title)
        .first()

      if (!existing) {
        const task = await Task.create({
          projectId: project.id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assigneeId: assignee?.id,
          createdBy: creator?.id,
          dueDate: data.dueDate,
          estimatedHours: data.estimatedHours,
          actualHours: data.actualHours,
          position: data.position,
          completedAt: data.status === 'done' ? DateTime.now().minus({ days: 2 }) : null,
        })
        tasks.push(task)
        console.log(`  ✓ Created task: ${data.title}`)
      } else {
        tasks.push(existing)
        console.log(`  ⚠ Task already exists: ${data.title}`)
      }
    }

    return tasks
  }

  private async createTimeEntries(tasks: Task[], users: { [key: string]: User }) {
    if (tasks.length === 0) return

    const timeEntriesData = [
      {
        taskIndex: 0,
        userEmail: 'tech+02@gocodingnow.com',
        description: 'Working on homepage design',
        durationMinutes: 240,
        date: DateTime.now().minus({ days: 6 }),
        billable: true,
      },
      {
        taskIndex: 0,
        userEmail: 'tech+02@gocodingnow.com',
        description: 'Finalizing mockups',
        durationMinutes: 360,
        date: DateTime.now().minus({ days: 5 }),
        billable: true,
      },
      {
        taskIndex: 1,
        userEmail: 'tech+02@gocodingnow.com',
        description: 'Building React components',
        durationMinutes: 480,
        date: DateTime.now().minus({ days: 3 }),
        billable: true,
      },
      {
        taskIndex: 1,
        userEmail: 'tech+02@gocodingnow.com',
        description: 'Component development continues',
        durationMinutes: 420,
        date: DateTime.now().minus({ days: 1 }),
        billable: true,
      },
      {
        taskIndex: 4,
        userEmail: 'tech+02@gocodingnow.com',
        description: 'Implementing JWT authentication',
        durationMinutes: 360,
        date: DateTime.now().minus({ days: 2 }),
        billable: true,
      },
    ]

    for (const data of timeEntriesData) {
      const task = tasks[data.taskIndex]
      const user = users[data.userEmail]

      if (!task || !user) continue

      const startTime = data.date.set({ hour: 9, minute: 0 })
      const endTime = startTime.plus({ minutes: data.durationMinutes })

      const existing = await TimeEntry.query()
        .where('task_id', task.id)
        .where('user_id', user.id)
        .where('date', data.date.toSQLDate()!)
        .first()

      if (!existing) {
        await TimeEntry.create({
          taskId: task.id,
          userId: user.id,
          description: data.description,
          startTime: startTime,
          endTime: endTime,
          durationMinutes: data.durationMinutes,
          billable: data.billable,
          date: data.date,
          isRunning: false,
        })
        console.log(`  ✓ Created time entry for task: ${task.title}`)
      }
    }
  }
}
