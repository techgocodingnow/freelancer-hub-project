# Member Management Feature - Quick Start Guide

## Overview
The Member Management feature allows administrators and owners to invite new members to join their organization or specific projects through email invitations.

## Quick Start

### 1. Start the Application

```bash
# Terminal 1 - Backend
cd freelancer-hub-backend
npm run dev

# Terminal 2 - Frontend
cd freelancer-hub-dashboard
npm run dev
```

### 2. Access the Application
- Frontend: http://localhost:5175 (or the port shown in terminal)
- Backend: http://localhost:61524 (or the port shown in terminal)

### 3. Invite a Member

#### Organization-Level Invitation:
1. Log in as admin or owner
2. Navigate to **Users** page
3. Click **"Invite Member"** button
4. Enter email address
5. Select role (Owner, Admin, Member, or Viewer)
6. Click **"Send Invitation"**

#### Project-Level Invitation:
1. Log in as admin or owner
2. Navigate to a **Project** details page
3. Click **"Team"** tab
4. Click **"Invite Member"** button
5. Enter email address
6. Select role
7. Click **"Send Invitation"**

### 4. Accept an Invitation

1. User receives invitation email (currently logged to console)
2. User clicks registration link: `/register/invitation/{token}`
3. User sees invitation details (organization, role, project)
4. User enters full name and password
5. User clicks **"Create Account & Join"**
6. User is automatically logged in and redirected to dashboard

## Features

### ✅ Implemented Features

1. **Role-Based Access Control**
   - Only admin and owner can invite members
   - Proper permission checks on all endpoints

2. **Organization Invitations**
   - Invite users to join organization
   - Assign roles: Owner, Admin, Member, Viewer
   - View pending invitations
   - Resend or cancel invitations

3. **Project Invitations**
   - Invite users to specific projects
   - Auto-add to organization and project
   - Project-specific invitation management

4. **Invitation Management**
   - List all pending invitations
   - Resend invitation (extends expiration)
   - Cancel pending invitations
   - Automatic expiration (7 days)

5. **Secure Registration**
   - Unique 64-character tokens
   - Token validation
   - Email verification
   - Expiration checking

6. **User Experience**
   - Pre-filled email on registration
   - Display organization and project details
   - Auto-login after registration
   - Responsive design (mobile-friendly)

7. **Email Notifications**
   - Invitation emails with registration links
   - Professional HTML templates
   - Organization and project information
   - Expiration date included

8. **Validation & Security**
   - Email format validation
   - Duplicate invitation prevention
   - Existing user detection
   - Token expiration
   - Multi-tenant isolation

## API Endpoints

### Public Endpoints
```
GET /invitations/validate/:token - Validate invitation token
```

### Authenticated Endpoints (Tenant-Scoped)
```
GET    /invitations              - List invitations
POST   /invitations              - Create invitation (admin/owner)
POST   /invitations/:id/resend   - Resend invitation (admin/owner)
DELETE /invitations/:id           - Cancel invitation (admin/owner)
```

### Modified Endpoints
```
POST /register - Now accepts optional invitationToken parameter
```

## Database Schema

### Invitations Table
```sql
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  project_id INTEGER REFERENCES projects(id),
  invited_by INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);
```

## Configuration

### Email Service
Currently using placeholder email service that logs to console.

To configure real email service, update:
`freelancer-hub-backend/app/services/email_service.ts`

### Invitation Expiration
Default: 7 days

To change, modify the `expiresInDays` parameter in:
`freelancer-hub-backend/app/controllers/invitations.ts`

### Base URL for Registration Links
Set in environment variable:
```env
APP_URL=http://localhost:5175
```

## User Roles

### Owner
- Full access to all features
- Can invite members
- Can manage all settings

### Admin
- Can manage users and projects
- Can invite members
- Cannot modify organization settings

### Member
- Standard access to assigned projects
- Cannot invite members
- Can view and edit assigned tasks

### Viewer
- Read-only access
- Cannot invite members
- Cannot modify any data

## Common Use Cases

### Use Case 1: Onboard New Team Member
1. Admin invites user with "Member" role
2. User receives email and registers
3. User is added to organization
4. Admin assigns user to specific projects

### Use Case 2: Add Contractor to Project
1. Admin invites user with "Member" role for specific project
2. User receives email and registers
3. User is added to organization AND project
4. User can immediately access project tasks

### Use Case 3: Promote Existing Member
1. Admin changes user's role in Users page
2. User's permissions updated immediately
3. No new invitation needed

## Troubleshooting

### Issue: Invitation email not received
**Solution:** Check console logs - emails are currently logged, not sent

### Issue: "Invalid invitation token" error
**Possible causes:**
- Token expired (check `expires_at` in database)
- Token already used (check `status` field)
- Token doesn't exist (typo in URL)

### Issue: "User already exists" error
**Solution:** User is already a member - use role change instead

### Issue: Cannot see "Invite Member" button
**Solution:** Only admin and owner roles can invite members

### Issue: Invitation not appearing in list
**Possible causes:**
- Wrong tenant context
- Invitation already accepted/cancelled
- Filter applied (check status filter)

## Development Notes

### Adding Real Email Service

Replace placeholder in `email_service.ts`:

```typescript
async sendInvitationEmail(invitation: Invitation, baseUrl: string) {
  // Replace console.log with actual email sending
  const emailHtml = this.generateInvitationEmailHTML(invitation, baseUrl);
  
  // Example with nodemailer:
  await this.transporter.sendMail({
    from: 'noreply@yourapp.com',
    to: invitation.email,
    subject: `You're invited to join ${invitation.tenant.name}`,
    html: emailHtml,
  });
}
```

### Customizing Invitation Expiration

In `invitations.ts` controller:

```typescript
const invitation = await Invitation.createInvitation({
  // ... other fields
  expiresInDays: 14, // Change from 7 to 14 days
});
```

### Adding Invitation History

Create new endpoint to show all invitations (not just pending):

```typescript
async history({ tenant, request, response }: HttpContext) {
  const invitations = await Invitation.query()
    .where('tenant_id', tenant.id)
    .preload('role')
    .preload('inviter')
    .preload('acceptedByUser')
    .orderBy('created_at', 'desc')
    .paginate(page, limit);
  
  return response.ok({ data: invitations });
}
```

## Testing

See `TESTING_GUIDE.md` for comprehensive testing instructions.

Quick smoke test:
1. ✅ Create invitation as admin
2. ✅ View pending invitations
3. ✅ Resend invitation
4. ✅ Cancel invitation
5. ✅ Register with invitation token
6. ✅ Verify user added to organization
7. ✅ Verify invitation marked as accepted

## Files Modified/Created

### Backend
- `database/migrations/1759280000000_create_invitations_table.ts` ✨ New
- `app/models/invitation.ts` ✨ New
- `app/controllers/invitations.ts` ✨ New
- `app/controllers/auth.ts` 📝 Modified
- `app/services/email_service.ts` 📝 Modified
- `app/validators/auth.ts` 📝 Modified
- `start/routes.ts` 📝 Modified

### Frontend
- `src/components/invitations/InviteMemberModal.tsx` ✨ New
- `src/components/invitations/index.ts` ✨ New
- `src/pages/register/invitation.tsx` ✨ New
- `src/pages/users/list.tsx` 📝 Modified
- `src/pages/projects/show.tsx` 📝 Modified
- `src/services/api/api.ts` 📝 Modified
- `src/services/api/types.ts` 📝 Modified
- `src/services/api/endpoint.ts` 📝 Modified
- `src/App.tsx` 📝 Modified

## Next Steps

### Recommended Enhancements
1. **Real Email Service** - Integrate with SendGrid, AWS SES, or similar
2. **Bulk Invitations** - Invite multiple users at once
3. **Custom Expiration** - Let admins set custom expiration periods
4. **Invitation Templates** - Pre-defined templates for different roles
5. **Analytics** - Track invitation acceptance rates
6. **Reminders** - Automatic reminders for pending invitations
7. **Project Manager Permissions** - Allow PMs to invite to their projects
8. **Invitation History** - View all invitations (accepted, expired, cancelled)

## Support

For issues or questions:
1. Check `TESTING_GUIDE.md` for common scenarios
2. Review `MEMBER_MANAGEMENT_IMPLEMENTATION.md` for technical details
3. Check console logs for errors
4. Verify database state with SQL queries

## License

Part of the Freelancer Hub project.

