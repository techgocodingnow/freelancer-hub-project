# Member Management Feature - Testing Guide

## Prerequisites
1. Backend server running: `cd freelancer-hub-backend && npm run dev`
2. Frontend server running: `cd freelancer-hub-dashboard && npm run dev`
3. Database migrations applied: `cd freelancer-hub-backend && node ace migration:run`
4. At least one tenant/organization created
5. Test users with different roles (owner, admin, member, viewer)

## Test Scenarios

### 1. Organization-Level Invitations

#### Test 1.1: Create Invitation as Admin/Owner
**Steps:**
1. Log in as admin or owner
2. Navigate to Users page
3. Click "Invite Member" button
4. Enter email address: `newuser@example.com`
5. Select role: "Member"
6. Click "Send Invitation"

**Expected Results:**
- Success message displayed
- Invitation appears in "Pending Invitations" section
- Email logged to console (since email service is placeholder)
- Invitation has status "Pending"
- Expiration date is 7 days from now

#### Test 1.2: Attempt to Create Invitation as Member
**Steps:**
1. Log in as member (non-admin)
2. Navigate to Users page
3. Verify "Invite Member" button is NOT visible

**Expected Results:**
- Button should not be displayed for non-admin users
- Pending invitations section should not be visible

#### Test 1.3: Duplicate Invitation Prevention
**Steps:**
1. Log in as admin
2. Create invitation for `test@example.com`
3. Try to create another invitation for same email

**Expected Results:**
- Error message: "A pending invitation already exists for this email"
- No duplicate invitation created

#### Test 1.4: Invite Existing User
**Steps:**
1. Log in as admin
2. Try to invite email of existing tenant member

**Expected Results:**
- Error message: "User is already a member of this organization"
- No invitation created

### 2. Invitation Management

#### Test 2.1: Resend Invitation
**Steps:**
1. Log in as admin
2. Navigate to Users page
3. Find pending invitation
4. Click "Resend" button

**Expected Results:**
- Success message displayed
- New email sent (logged to console)
- Expiration date extended by 7 days

#### Test 2.2: Cancel Invitation
**Steps:**
1. Log in as admin
2. Navigate to Users page
3. Find pending invitation
4. Click "Cancel" button
5. Confirm cancellation

**Expected Results:**
- Confirmation modal appears
- After confirmation, success message displayed
- Invitation removed from pending list
- Invitation status changed to "cancelled" in database

### 3. Invitation-Based Registration

#### Test 3.1: Valid Invitation Registration
**Steps:**
1. Create invitation for `newuser@example.com`
2. Copy invitation token from database or console log
3. Navigate to `/register/invitation/{token}`
4. Verify email is pre-filled
5. Enter full name: "New User"
6. Enter password: "password123"
7. Confirm password: "password123"
8. Click "Create Account & Join"

**Expected Results:**
- Invitation details displayed (organization, role)
- Email field is disabled and pre-filled
- Registration succeeds
- User is created and added to organization
- User is automatically logged in
- Redirected to tenant dashboard
- Invitation status changed to "accepted"

#### Test 3.2: Invalid Token
**Steps:**
1. Navigate to `/register/invitation/invalid-token-12345`

**Expected Results:**
- Error page displayed
- Message: "Invalid invitation token"
- "Go to Login" button available

#### Test 3.3: Expired Invitation
**Steps:**
1. Create invitation
2. Manually update `expires_at` in database to past date
3. Navigate to invitation registration page

**Expected Results:**
- Error message: "This invitation has expired"
- Cannot proceed with registration

#### Test 3.4: Email Mismatch
**Steps:**
1. Create invitation for `user1@example.com`
2. Navigate to invitation registration page
3. Manually change email in form (if possible)
4. Try to register

**Expected Results:**
- Error: "Email does not match invitation"
- Registration fails

### 4. Project-Level Invitations

#### Test 4.1: Invite Member to Project
**Steps:**
1. Log in as admin/owner
2. Navigate to a project details page
3. Click "Team" tab
4. Click "Invite Member" button
5. Enter email: `projectmember@example.com`
6. Select role: "Member"
7. Click "Send Invitation"

**Expected Results:**
- Success message displayed
- Invitation appears in project's pending invitations
- Modal shows project name in title
- Email includes project information

#### Test 4.2: Accept Project Invitation
**Steps:**
1. Create project invitation
2. Register using invitation token
3. After login, navigate to projects

**Expected Results:**
- User is added to organization
- User is also added to specific project
- User can see the project in their project list
- User appears in project's team members

#### Test 4.3: Resend/Cancel Project Invitation
**Steps:**
1. Navigate to project details
2. Click "Team" tab
3. Find pending invitation
4. Test resend and cancel buttons

**Expected Results:**
- Same behavior as organization invitations
- Actions work correctly for project-specific invitations

### 5. Email Validation

#### Test 5.1: Invalid Email Format
**Steps:**
1. Open invite modal
2. Enter invalid email: "notanemail"
3. Try to submit

**Expected Results:**
- Form validation error
- Message: "Please enter a valid email address"
- Cannot submit form

#### Test 5.2: Empty Email
**Steps:**
1. Open invite modal
2. Leave email field empty
3. Try to submit

**Expected Results:**
- Form validation error
- Message: "Please enter an email address"
- Cannot submit form

### 6. Role Selection

#### Test 6.1: Role Descriptions
**Steps:**
1. Open invite modal
2. Click role dropdown
3. Select different roles

**Expected Results:**
- All roles displayed (Owner, Admin, Member, Viewer)
- Role icons displayed (👑, ⚙️, 👤, 👁️)
- Description appears below dropdown when role selected

#### Test 6.2: Required Role Selection
**Steps:**
1. Open invite modal
2. Enter email
3. Leave role unselected
4. Try to submit

**Expected Results:**
- Form validation error
- Message: "Please select a role"
- Cannot submit form

### 7. Invitation Expiration

#### Test 7.1: Check Expiration Date
**Steps:**
1. Create invitation
2. Check database `expires_at` field

**Expected Results:**
- Expiration date is 7 days from creation
- Displayed correctly in UI

#### Test 7.2: Automatic Expiration Handling
**Steps:**
1. Create invitation
2. Manually set `expires_at` to past date
3. Try to accept invitation

**Expected Results:**
- Validation fails
- Error: "This invitation has expired"

### 8. Multi-Tenant Isolation

#### Test 8.1: Tenant Isolation
**Steps:**
1. Create invitation in Tenant A
2. Log in to Tenant B as admin
3. Check invitations list

**Expected Results:**
- Tenant B admin cannot see Tenant A's invitations
- Invitations are properly scoped to tenant

#### Test 8.2: Cross-Tenant Invitation
**Steps:**
1. Create invitation in Tenant A
2. Try to accept invitation while logged into Tenant B

**Expected Results:**
- User is added to Tenant A (from invitation)
- Proper tenant context maintained

### 9. UI/UX Testing

#### Test 9.1: Mobile Responsiveness
**Steps:**
1. Resize browser to mobile width
2. Test all invitation features

**Expected Results:**
- Modal displays correctly on mobile
- Buttons are appropriately sized
- Tables scroll horizontally if needed
- All features accessible

#### Test 9.2: Loading States
**Steps:**
1. Open invite modal
2. Submit invitation
3. Observe loading state

**Expected Results:**
- Submit button shows loading spinner
- Form is disabled during submission
- Success/error message after completion

#### Test 9.3: Error Handling
**Steps:**
1. Disconnect backend
2. Try to create invitation

**Expected Results:**
- Error message displayed
- User-friendly error text
- Form remains usable after error

### 10. Edge Cases

#### Test 10.1: Special Characters in Email
**Steps:**
1. Try to invite: `user+test@example.com`

**Expected Results:**
- Email accepted (valid format)
- Invitation created successfully

#### Test 10.2: Case Sensitivity
**Steps:**
1. Create invitation for `User@Example.com`
2. Try to create another for `user@example.com`

**Expected Results:**
- Duplicate detection works (case-insensitive)
- Error message displayed

#### Test 10.3: Concurrent Invitations
**Steps:**
1. Open two browser tabs
2. Create invitations simultaneously

**Expected Results:**
- Both invitations created if different emails
- Proper error handling if same email

## Database Verification

After each test, verify database state:

```sql
-- Check invitation record
SELECT * FROM invitations WHERE email = 'test@example.com';

-- Check invitation status
SELECT email, status, expires_at FROM invitations;

-- Check user was added to tenant
SELECT * FROM tenant_users WHERE user_id = {new_user_id};

-- Check user was added to project (if project invitation)
SELECT * FROM project_members WHERE user_id = {new_user_id};
```

## Console Logs to Check

1. Email service logs (invitation emails)
2. API request/response logs
3. Error logs
4. Token generation logs

## Performance Testing

1. Create 100 invitations
2. Check list loading performance
3. Test pagination
4. Test filtering by status

## Security Testing

1. Try to access invitation endpoints without authentication
2. Try to create invitation as non-admin
3. Try to use someone else's invitation token
4. Try SQL injection in email field
5. Try XSS in email field

## Cleanup

After testing:
```sql
-- Remove test invitations
DELETE FROM invitations WHERE email LIKE '%@example.com';

-- Remove test users
DELETE FROM users WHERE email LIKE '%@example.com';
```

## Known Limitations

1. Email service is placeholder (logs to console)
2. No bulk invitation feature yet
3. No invitation history view
4. No custom expiration periods
5. Project managers cannot invite (only admin/owner)

## Success Criteria

All tests should pass with:
- ✅ Proper error handling
- ✅ User-friendly messages
- ✅ Data integrity maintained
- ✅ Security enforced
- ✅ UI responsive and accessible
- ✅ No console errors
- ✅ Proper tenant isolation

