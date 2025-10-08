# Notification System - Quick Start Guide

## 🚀 Quick Test (5 Minutes)

This guide will help you quickly test the new notification system.

---

## Prerequisites

- Backend server running on http://localhost:58480
- Frontend server running on http://localhost:5175
- 2 user accounts in the same organization
- At least 1 project created

---

## Step-by-Step Test

### 1. Check the Notification Bell

1. Open http://localhost:5175 in your browser
2. Login with any user account
3. Look at the header (top right)
4. You should see a **bell icon** between the tenant selector and the dark mode toggle
5. The bell should have no badge (or show "0") if you have no notifications

✅ **Expected**: Bell icon visible in header

---

### 2. Create a Notification

**Setup**: You need 2 users in the same organization. Let's call them:
- **User A** (Admin/Owner)
- **User B** (Any role, already in organization)

**Steps**:

1. **Login as User A** (admin/owner)
2. Navigate to any project
3. Click **"Invite Member"** button
4. In the search box, type User B's name or email
5. Select **User B** from the autocomplete dropdown
6. You should see a green alert: **"In-App Notification - This user will receive an in-app notification"**
7. Select a role (e.g., "Member")
8. Click **"Send Invitation"**
9. You should see a success message

✅ **Expected**: Invitation created, notification sent to User B

---

### 3. View the Notification

1. **Logout from User A**
2. **Login as User B**
3. Look at the bell icon in the header
4. You should see a **red badge with "1"**
5. **Click the bell icon**
6. A drawer should open from the right side
7. You should see **one notification** with:
   - **Blue dot** (unread indicator)
   - **Light blue background**
   - **Bold title**: "Invitation to join [Project Name]"
   - **Message**: "[User A] invited you to join [Project Name] as [Role]"
   - **Timestamp**: "a few seconds ago" or similar
   - **Button**: "View Project"

✅ **Expected**: Notification visible in drawer with correct styling

---

### 4. Mark as Read

1. With the drawer still open, **click anywhere on the notification** (not on the button)
2. The notification should change:
   - Blue dot **disappears**
   - Background changes to **white**
   - Text becomes **normal weight** (not bold)
3. The badge on the bell icon should **disappear** or show "0"

✅ **Expected**: Notification marked as read, badge updated

---

### 5. Test Action Button

1. **Refresh the page** (to get the notification back as unread, or create a new one)
2. Open the notification drawer
3. Click the **"View Project"** button on a notification
4. You should be **navigated to the project page**
5. The notification should be **marked as read**

✅ **Expected**: Navigation works, notification marked as read

---

### 6. Test "Mark All as Read"

**Setup**: Create 2-3 more notifications (invite User B to other projects)

**Steps**:

1. Login as User B
2. Open notification drawer
3. You should see multiple unread notifications
4. Click **"Mark all as read"** button in the drawer header
5. All notifications should change to read state (white background, no dots)
6. Badge should disappear
7. You should see a success message: "All notifications marked as read"

✅ **Expected**: All notifications marked as read

---

### 7. Test Polling

**Setup**: Keep User B logged in with the drawer **closed**

**Steps**:

1. In another browser/incognito window, **login as User A**
2. Invite User B to another project
3. Go back to User B's browser
4. **Wait up to 30 seconds** (don't refresh)
5. The badge should **automatically update** to show the new notification count

✅ **Expected**: Badge updates automatically without page refresh

---

### 8. Test Empty State

1. Login as a user with **no notifications**
2. Click the bell icon
3. You should see:
   - Large gray bell icon
   - Text: "No notifications yet"
   - No "Mark all as read" button

✅ **Expected**: Empty state displays correctly

---

### 9. Test Pagination (Optional)

**Setup**: Create 25+ notifications for a user

**Steps**:

1. Login as that user
2. Open notification drawer
3. Scroll to the bottom
4. You should see:
   - First 20 notifications
   - **"Load More"** button
   - Text: "Showing 20 of [total] notifications"
5. Click **"Load More"**
6. Next batch of notifications should load
7. Text should update: "Showing 40 of [total] notifications"

✅ **Expected**: Pagination works correctly

---

### 10. Test Mobile View (Optional)

1. Resize browser to mobile width (< 768px)
2. Click notification bell
3. Drawer should open **full width** (100%)
4. All functionality should work
5. Touch-friendly button sizes

✅ **Expected**: Mobile view works correctly

---

## 🐛 Troubleshooting

### Bell icon not showing

- Check browser console for errors
- Verify frontend server is running
- Check that NotificationBell is imported in header component

### Badge not updating

- Check backend server is running
- Verify API endpoint is accessible: http://localhost:58480/api/v1/notifications/unread-count
- Check browser console for API errors
- Verify you're logged in and have a valid token

### Notifications not appearing

- Check that invitation was created successfully
- Verify the invited user is an **existing organization member**
- Check database: `SELECT * FROM notifications WHERE user_id = [user_id]`
- Check backend console for errors

### Drawer not opening

- Check browser console for errors
- Verify NotificationDrawer component is rendering
- Check that drawer state is being managed correctly

### "Mark as read" not working

- Check API endpoint: http://localhost:58480/api/v1/notifications/:id/read
- Check browser console for API errors
- Verify you have permission to mark the notification as read

---

## 📊 Quick API Tests

### Get Notifications

```bash
curl -X GET "http://localhost:58480/api/v1/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"
```

### Get Unread Count

```bash
curl -X GET "http://localhost:58480/api/v1/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"
```

### Mark as Read

```bash
curl -X PATCH "http://localhost:58480/api/v1/notifications/1/read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"
```

---

## ✅ Success Criteria

If all the above tests pass, the notification system is working correctly!

**What's Working**:
- ✅ Notification creation
- ✅ Notification display
- ✅ Badge count
- ✅ Mark as read (individual)
- ✅ Mark all as read
- ✅ Action buttons
- ✅ Polling
- ✅ Empty state
- ✅ Pagination
- ✅ Mobile view

---

## 📚 Next Steps

1. **Full Testing**: See `NOTIFICATION_SYSTEM_TESTING_GUIDE.md` for comprehensive tests
2. **Documentation**: See `NOTIFICATION_SYSTEM_IMPLEMENTATION_SUMMARY.md` for details
3. **Deployment**: Follow deployment checklist in summary document
4. **Feedback**: Gather user feedback and iterate

---

## 🎉 Congratulations!

You've successfully tested the notification system! The feature is ready for production use.

For more detailed testing, refer to the comprehensive testing guide.

