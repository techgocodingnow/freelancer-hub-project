# Testing Guide: In-App Notifications for Project Invitations

## Prerequisites

1. **Backend Running**: `cd freelancer-hub-backend && npm run dev`
2. **Frontend Running**: `cd freelancer-hub-dashboard && npm run dev`
3. **Database**: PostgreSQL running with migrations applied
4. **Test Data**: At least one organization with multiple users and projects

## Test Scenarios

### Scenario 1: Invite Existing User to Project (In-App Notification)

**Setup**:
- User A: Admin/Owner of Organization
- User B: Existing member of Organization (not in Project X)
- Project X: Exists in Organization

**Steps**:
1. Login as User A
2. Navigate to Project X details page
3. Click on "Team" tab
4. Click "Invite Member" button
5. In the modal, start typing User B's name or email
6. Observe autocomplete dropdown appears with User B's details
7. Select User B from dropdown
8. Observe alert changes from blue "Send an Email Invitation" to green "In-App Notification"
9. Alert should say: "[User B Name] is already a member of your organization. They will receive an in-app notification to join this project."
10. Select a role (e.g., "Member")
11. Click "Invite" button
12. Observe success message: "Invitation sent. User will see it when they log in."
13. Logout

**Expected Results**:
- ✅ Autocomplete shows User B in dropdown
- ✅ Alert changes to green with in-app notification message
- ✅ Success message indicates in-app notification
- ✅ No email sent to User B
- ✅ Invitation created with status "pending"

### Scenario 2: Accept Project Invitation

**Setup**:
- Continuing from Scenario 1
- User B has pending invitation to Project X

**Steps**:
1. Login as User B
2. Observe banner at top of dashboard
3. Banner should show: "[User A Name] invited you to join [Project X] as MEMBER"
4. Banner should show relative time (e.g., "Just now" or "2 minutes ago")
5. Click "Accept" button
6. Observe loading state on Accept button
7. Observe success message: "You've joined [Project X]!"
8. Wait 1.5 seconds
9. Observe automatic navigation to Project X page
10. Verify User B is now listed in Project X team members

**Expected Results**:
- ✅ Banner displays with correct information
- ✅ Accept button shows loading state
- ✅ Success message appears
- ✅ Automatic navigation to project
- ✅ User B added to project with correct role
- ✅ Banner disappears after acceptance
- ✅ Invitation status changed to "accepted"

### Scenario 3: Decline Project Invitation

**Setup**:
- User A: Admin/Owner
- User C: Existing member with pending invitation to Project Y

**Steps**:
1. Login as User C
2. Observe invitation banner
3. Click "Decline" button
4. Observe confirmation modal appears
5. Modal should ask: "Are you sure you want to decline the invitation to join [Project Y]?"
6. Click "Yes, Decline" button
7. Observe success message: "Invitation declined"
8. Observe banner disappears
9. Refresh page
10. Verify banner does not reappear

**Expected Results**:
- ✅ Confirmation modal appears
- ✅ Success message after declining
- ✅ Banner disappears
- ✅ Invitation status changed to "rejected"
- ✅ Banner does not reappear on refresh

### Scenario 4: Invite New User to Project (Email Invitation)

**Setup**:
- User A: Admin/Owner
- newuser@example.com: Email not in organization

**Steps**:
1. Login as User A
2. Navigate to any project
3. Click "Invite Member" in Team tab
4. Type complete email: "newuser@example.com"
5. Observe autocomplete shows no results
6. Observe alert remains blue "Send an Email Invitation"
7. Alert should say: "The user will receive an email invitation to join this project..."
8. Select a role
9. Click "Invite" button
10. Observe success message: "Invitation email sent successfully"

**Expected Results**:
- ✅ No autocomplete results for new email
- ✅ Alert remains blue with email invitation message
- ✅ Success message indicates email sent
- ✅ Email sent to newuser@example.com (check console logs)
- ✅ Invitation created with status "pending"

### Scenario 5: Multiple Pending Invitations

**Setup**:
- User D: Existing member
- Create 3 pending invitations for User D to different projects

**Steps**:
1. As Admin, invite User D to Project A
2. As Admin, invite User D to Project B
3. As Admin, invite User D to Project C
4. Login as User D
5. Observe all 3 invitations displayed in banners
6. Each banner should show different project names
7. Accept invitation to Project A
8. Observe only 2 banners remain
9. Decline invitation to Project B
10. Observe only 1 banner remains (Project C)

**Expected Results**:
- ✅ All 3 invitations display correctly
- ✅ Each banner shows correct project info
- ✅ Accepting removes that specific banner
- ✅ Declining removes that specific banner
- ✅ Remaining invitations still visible

### Scenario 6: Autocomplete Search Functionality

**Setup**:
- Organization with users: Alice (alice@example.com), Bob (bob@example.com), Charlie (charlie@example.com)

**Steps**:
1. Login as Admin
2. Open "Invite Member" modal
3. Type "a" - observe no results (minimum 2 characters)
4. Type "al" - observe Alice appears in dropdown
5. Type "ali" - observe Alice still appears
6. Clear and type "bob@" - observe Bob appears
7. Clear and type "charlie" - observe Charlie appears
8. Observe each result shows:
   - User icon
   - Full name
   - Email address
   - Role tag (colored)
9. Click on Alice from dropdown
10. Observe email field populated with alice@example.com
11. Observe alert changes to green in-app notification

**Expected Results**:
- ✅ No search with less than 2 characters
- ✅ Search works with name or email
- ✅ Results display correctly formatted
- ✅ Clicking result populates email field
- ✅ Alert updates to show in-app notification
- ✅ Debouncing prevents excessive API calls (check network tab)

### Scenario 7: Expired Invitation Not Shown

**Setup**:
- Create invitation with past expiration date (manually in database)

**Steps**:
1. Login as user with expired invitation
2. Observe banner does not show expired invitation
3. Verify only pending, non-expired invitations appear

**Expected Results**:
- ✅ Expired invitations not displayed
- ✅ Only valid pending invitations shown

### Scenario 8: Already Project Member

**Setup**:
- User E: Already member of Project Z

**Steps**:
1. Login as Admin
2. Navigate to Project Z
3. Try to invite User E (who is already a member)
4. Search and select User E
5. Select role and submit
6. Observe error message: "User is already a member of this project"

**Expected Results**:
- ✅ Error message displayed
- ✅ Invitation not created
- ✅ User informed of existing membership

### Scenario 9: Invitation Belongs to Different User

**Setup**:
- Invitation for userA@example.com
- Login as userB@example.com

**Steps**:
1. Get invitation ID for userA
2. As userB, try to accept invitation via API or direct URL manipulation
3. Observe error: "This invitation is not for you"

**Expected Results**:
- ✅ Security check prevents accepting others' invitations
- ✅ Appropriate error message

### Scenario 10: Organization-Level Invitation (Not Project)

**Setup**:
- Create organization-level invitation (projectId = null)

**Steps**:
1. Login as invited user
2. Observe banner does NOT show organization invitation
3. Verify only project invitations appear in banner

**Expected Results**:
- ✅ Organization invitations not shown in banner
- ✅ Only project invitations displayed
- ✅ Organization invitations handled separately (existing flow)

## API Testing with cURL

### Get My Invitations
```bash
curl -X GET http://localhost:58391/api/v1/invitations/my-invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Accept Invitation
```bash
curl -X POST http://localhost:58391/api/v1/invitations/123/accept \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Reject Invitation
```bash
curl -X POST http://localhost:58391/api/v1/invitations/123/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Search Organization Members
```bash
curl -X GET "http://localhost:58391/api/v1/tenants/YOUR_TENANT_SLUG/users/search?q=alice" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG" \
  -H "Content-Type: application/json"
```

### Create Invitation (Enhanced)
```bash
curl -X POST http://localhost:58391/api/v1/tenants/YOUR_TENANT_SLUG/invitations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "existing@example.com",
    "roleId": 3,
    "projectId": 1
  }'
```

## Browser DevTools Checks

### Network Tab
1. Open DevTools → Network tab
2. Perform autocomplete search
3. Verify debouncing: Only one request per 300ms
4. Check request/response for `/users/search`
5. Verify proper headers (Authorization, X-Tenant-Slug)

### Console Tab
1. Check for any errors
2. Verify email service logs (backend console)
3. Check for "Failed to send invitation email" for existing users (should not appear)

### Application Tab
1. Verify localStorage has:
   - `auth_token`
   - `tenant_slug`
2. Check token is included in API requests

## Performance Testing

### Load Test
1. Create 20+ pending invitations for one user
2. Login and observe banner performance
3. Verify smooth rendering
4. Check memory usage

### Search Performance
1. Organization with 100+ members
2. Perform autocomplete search
3. Verify results return quickly (< 500ms)
4. Check debouncing prevents request spam

## Accessibility Testing

1. **Keyboard Navigation**:
   - Tab through invite modal
   - Use arrow keys in autocomplete
   - Press Enter to select
   - Press Escape to close modal

2. **Screen Reader**:
   - Verify labels are read correctly
   - Check button descriptions
   - Verify alert messages are announced

## Mobile Testing

1. Open on mobile device or responsive mode
2. Verify banner displays correctly
3. Check buttons are tappable
4. Verify autocomplete works on mobile
5. Test modal responsiveness

## Regression Testing

Ensure existing functionality still works:

1. ✅ Email invitations for new users still work
2. ✅ Organization-level invitations still work
3. ✅ Invitation validation endpoint still works
4. ✅ Registration with invitation token still works
5. ✅ Resend invitation still works
6. ✅ Cancel invitation still works
7. ✅ Users list shows pending invitations
8. ✅ Projects list shows pending invitations

## Common Issues and Solutions

### Issue: Banner not appearing
- **Check**: User has pending project invitations
- **Check**: Invitations not expired
- **Check**: API endpoint returning data
- **Solution**: Verify `getMyInvitations()` API call succeeds

### Issue: Autocomplete not working
- **Check**: Minimum 2 characters typed
- **Check**: Network request to `/users/search`
- **Check**: User has permission to search
- **Solution**: Check browser console for errors

### Issue: Email still sent to existing users
- **Check**: User detection logic in backend
- **Check**: `isExistingUser` flag in response
- **Solution**: Verify user exists in `tenant_users` table

### Issue: Accept button not working
- **Check**: Invitation ID is correct
- **Check**: User is authenticated
- **Check**: Invitation belongs to current user
- **Solution**: Check API response for error details

## Test Data Setup Script

```sql
-- Create test users
INSERT INTO users (email, full_name, password) VALUES
  ('alice@example.com', 'Alice Smith', 'hashed_password'),
  ('bob@example.com', 'Bob Johnson', 'hashed_password'),
  ('charlie@example.com', 'Charlie Brown', 'hashed_password');

-- Add users to organization
INSERT INTO tenant_users (tenant_id, user_id, role_id, is_active) VALUES
  (1, 1, 3, true),  -- Alice as Member
  (1, 2, 3, true),  -- Bob as Member
  (1, 3, 3, true);  -- Charlie as Member

-- Create test project
INSERT INTO projects (name, tenant_id, status) VALUES
  ('Test Project', 1, 'active');

-- Create pending invitation
INSERT INTO invitations (email, token, tenant_id, role_id, project_id, invited_by, status, expires_at) VALUES
  ('alice@example.com', 'test_token_123', 1, 3, 1, 1, 'pending', NOW() + INTERVAL '7 days');
```

## Success Criteria

All scenarios should pass with:
- ✅ No console errors
- ✅ Correct UI feedback
- ✅ Proper data persistence
- ✅ Security checks enforced
- ✅ Performance acceptable
- ✅ Accessibility maintained
- ✅ Mobile responsive

## Reporting Issues

When reporting issues, include:
1. Scenario number
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots/videos
5. Browser console errors
6. Network request/response
7. Environment details

