# Quick Start Guide: In-App Notifications Feature

## 🚀 Get Started in 5 Minutes

### Prerequisites
- PostgreSQL running
- Node.js installed
- Both backend and frontend repos cloned

### Step 1: Run Database Migration (30 seconds)

```bash
cd freelancer-hub-backend
node ace migration:run
```

Expected output:
```
❯ migrating database/migrations/1759653400185_create_update_invitations_add_rejected_statuses_table
❯ migrated database/migrations/1759653400185_create_update_invitations_add_rejected_statuses_table

Migrated in 44 ms
```

### Step 2: Start Backend (30 seconds)

```bash
cd freelancer-hub-backend
npm run dev
```

Expected output:
```
Server address: http://localhost:58391
Watch Mode: HMR
Ready in: 219 ms
```

### Step 3: Start Frontend (30 seconds)

```bash
cd freelancer-hub-dashboard
npm run dev
```

Expected output:
```
Local:   http://localhost:5175/
```

### Step 4: Test the Feature (3 minutes)

#### Quick Test Scenario

1. **Open browser**: http://localhost:5175

2. **Login** as an admin/owner user

3. **Navigate to a project**:
   - Click "Projects" in sidebar
   - Click on any project
   - Click "Team" tab

4. **Invite an existing user**:
   - Click "Invite Member" button
   - Start typing a user's name (e.g., "alice")
   - Select user from dropdown
   - Notice alert changes to green "In-App Notification"
   - Select a role
   - Click "Invite"
   - See success message: "Invitation sent. User will see it when they log in."

5. **Login as the invited user**:
   - Logout
   - Login as the user you invited
   - See banner at top: "[Name] invited you to join [Project] as [Role]"

6. **Accept the invitation**:
   - Click "Accept" button
   - See success message
   - Automatically navigate to project
   - Banner disappears

✅ **Feature working!**

## 📋 What's New?

### For Users
- **In-app notifications** for project invitations
- **No more emails** for existing organization members
- **One-click accept/decline** from banner
- **Auto-navigation** to project after accepting

### For Admins
- **Autocomplete search** when inviting members
- **Visual feedback** showing invitation method
- **Faster workflow** for adding team members

## 🎯 Key Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/invitations/my-invitations` | GET | Get my pending invitations |
| `/invitations/:id/accept` | POST | Accept invitation |
| `/invitations/:id/reject` | POST | Reject invitation |
| `/users/search?q=query` | GET | Search members |

### Frontend Routes

| Route | Description |
|-------|-------------|
| All authenticated pages | Shows ProjectInvitationBanner |
| Project details → Team tab | Enhanced InviteMemberModal |

## 🔍 Quick Debugging

### Issue: Banner not showing

**Check**:
```bash
# In browser console
Api.getMyInvitations()
```

Should return:
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "project": { "name": "Project Name" },
      "inviter": { "fullName": "Admin Name" },
      "role": { "name": "member" }
    }
  ]
}
```

### Issue: Autocomplete not working

**Check**:
```bash
# In browser console
Api.searchOrganizationMembers("alice")
```

Should return:
```json
{
  "data": [
    {
      "id": 1,
      "fullName": "Alice Smith",
      "email": "alice@example.com",
      "role": "member"
    }
  ]
}
```

### Issue: Email still sent to existing users

**Check backend logs**:
```
Should NOT see: "Sending invitation email to existing@example.com"
Should see: "Invitation sent. User will see it when they log in."
```

## 📊 Database Check

### Verify migration ran:

```sql
-- Check invitations table has rejected status
SELECT DISTINCT status FROM invitations;
```

Expected result:
```
pending
accepted
expired
cancelled
rejected  ← New!
```

### Check pending invitations:

```sql
SELECT 
  i.id,
  i.email,
  i.status,
  p.name as project_name,
  u.full_name as inviter_name
FROM invitations i
LEFT JOIN projects p ON i.project_id = p.id
LEFT JOIN users u ON i.invited_by = u.id
WHERE i.status = 'pending'
  AND i.project_id IS NOT NULL
  AND i.expires_at > NOW();
```

## 🧪 Quick Test Data

### Create test invitation (SQL):

```sql
-- Get IDs first
SELECT id, email FROM users WHERE email = 'testuser@example.com';
SELECT id FROM tenants WHERE slug = 'test-org';
SELECT id FROM projects WHERE name = 'Test Project';
SELECT id FROM roles WHERE name = 'member';

-- Create invitation
INSERT INTO invitations (
  email, 
  token, 
  tenant_id, 
  role_id, 
  project_id, 
  invited_by, 
  status, 
  expires_at,
  created_at,
  updated_at
) VALUES (
  'testuser@example.com',
  'test_token_' || md5(random()::text),
  1,  -- tenant_id
  3,  -- role_id (member)
  1,  -- project_id
  1,  -- invited_by (admin user id)
  'pending',
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW()
);
```

## 🎨 UI Components

### ProjectInvitationBanner
- **Location**: Top of all authenticated pages
- **Shows**: Pending project invitations
- **Actions**: Accept, Decline
- **Auto-hides**: When no invitations

### InviteMemberModal (Enhanced)
- **Location**: Projects → Team tab → "Invite Member" button
- **Features**: 
  - Autocomplete search
  - Green alert for existing users
  - Blue alert for new users
  - Role selector

## 📱 Mobile Testing

1. Open DevTools
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select mobile device
4. Test:
   - Banner displays correctly
   - Buttons are tappable
   - Modal is responsive
   - Autocomplete works

## 🔐 Security Notes

- All endpoints require authentication
- Invitations verified to belong to user
- Tenant isolation maintained
- Role-based access for creating invitations

## 📚 Documentation

- **Full Implementation**: `IN_APP_NOTIFICATIONS_IMPLEMENTATION.md`
- **Testing Guide**: `IN_APP_NOTIFICATIONS_TESTING_GUIDE.md`
- **Summary**: `ENHANCEMENT_SUMMARY.md`

## 🐛 Common Issues

### "Port already in use"
```bash
# Kill process on port
lsof -ti:58391 | xargs kill -9  # Backend
lsof -ti:5175 | xargs kill -9   # Frontend
```

### "Migration already ran"
```bash
# Check migration status
node ace migration:status

# Rollback if needed (careful!)
node ace migration:rollback
```

### "Cannot find module 'lodash'"
```bash
cd freelancer-hub-dashboard
npm install lodash
npm install --save-dev @types/lodash
```

## ✅ Success Checklist

After setup, verify:

- [ ] Backend running on port 58391
- [ ] Frontend running on port 5175
- [ ] Can login to dashboard
- [ ] Can see projects
- [ ] "Invite Member" button visible
- [ ] Autocomplete shows users when typing
- [ ] Alert changes color for existing users
- [ ] Can create invitation
- [ ] Banner shows pending invitations
- [ ] Can accept invitation
- [ ] Can decline invitation

## 🎓 Next Steps

1. ✅ Complete quick test scenario above
2. 📖 Read `IN_APP_NOTIFICATIONS_IMPLEMENTATION.md` for details
3. 🧪 Run full test suite from `IN_APP_NOTIFICATIONS_TESTING_GUIDE.md`
4. 🚀 Deploy to staging environment
5. 📊 Gather user feedback

## 💡 Tips

- **Use browser DevTools**: Network tab shows API calls
- **Check console**: Errors appear in browser console
- **Backend logs**: Watch terminal for API errors
- **Database**: Use SQL client to verify data

## 🆘 Need Help?

1. Check browser console for errors
2. Check backend terminal for logs
3. Verify database migration ran
4. Review documentation files
5. Test with curl commands from testing guide

---

**Time to complete**: ~5 minutes
**Difficulty**: Easy
**Status**: ✅ Ready to use

Happy testing! 🎉

