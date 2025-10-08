# Notification System Testing Guide

## Overview

This guide provides comprehensive testing instructions for the new notification system implemented in the freelancer-hub application.

## Prerequisites

- Backend server running on port 58391
- Frontend server running on port 5175
- At least 2 user accounts in the same organization
- At least 1 project created

## Test Scenarios

### 1. Notification Bell Display

**Test**: Verify notification bell appears in header

**Steps**:
1. Login to the application
2. Navigate to any page within a tenant

**Expected Result**:
- Bell icon visible in header (between tenant selector and dark mode toggle)
- Badge shows "0" or is hidden when no unread notifications
- Bell icon is clickable

---

### 2. Create Project Invitation Notification

**Test**: Verify notification is created when inviting existing user to project

**Steps**:
1. Login as Admin/Owner (User A)
2. Navigate to a project
3. Click "Invite Member" button
4. Search for an existing organization member (User B) who is NOT in this project
5. Select the user from autocomplete dropdown
6. Verify green "In-App Notification" alert appears
7. Select a role
8. Click "Send Invitation"

**Expected Result**:
- Success message appears
- Invitation created successfully
- No email sent (existing user gets in-app notification)

---

### 3. View Notification in Drawer

**Test**: Verify User B can see the notification

**Steps**:
1. Logout from User A
2. Login as User B
3. Check notification bell in header

**Expected Result**:
- Badge shows "1" (or increased count)
- Badge is red (#ff4d4f)

**Steps (continued)**:
4. Click the notification bell

**Expected Result**:
- Drawer opens from right side
- Width is 400px on desktop
- Header shows "Notifications" title
- "Mark all as read" button visible
- One notification displayed with:
  - Blue dot indicator (unread)
  - Light blue background (#e6f7ff)
  - Bold title: "Invitation to join [Project Name]"
  - Message: "[User A] invited you to join [Project Name] as [Role]"
  - Timestamp: "X minutes ago" or similar
  - "View Project" button

---

### 4. Mark Notification as Read (Click)

**Test**: Verify clicking notification marks it as read

**Steps**:
1. With drawer open, click anywhere on the notification item (not on action button)

**Expected Result**:
- Notification background changes to white/transparent
- Blue dot disappears
- Text weight changes from bold to normal
- Badge count decreases by 1
- If count reaches 0, badge disappears

---

### 5. Mark All as Read

**Test**: Verify "Mark all as read" button works

**Setup**:
1. Create 3-5 notifications for the user (invite to multiple projects)
2. Login as that user
3. Open notification drawer

**Steps**:
1. Click "Mark all as read" button in drawer header

**Expected Result**:
- All notifications change to read state (white background, no dots, normal weight)
- Badge count changes to 0
- Badge disappears from bell icon
- Success message: "All notifications marked as read"

---

### 6. Notification Action Button

**Test**: Verify "View Project" button works

**Steps**:
1. Open notification drawer
2. Click "View Project" button on a notification

**Expected Result**:
- Notification is marked as read
- User navigates to the project page
- Drawer closes (or stays open - verify expected behavior)

---

### 7. Pagination / Load More

**Test**: Verify pagination works with many notifications

**Setup**:
1. Create 25+ notifications for a user (invite to many projects)

**Steps**:
1. Login as that user
2. Open notification drawer
3. Scroll to bottom

**Expected Result**:
- First 20 notifications displayed
- "Load More" button visible at bottom
- Text shows "Showing 20 of [total] notifications"

**Steps (continued)**:
4. Click "Load More"

**Expected Result**:
- Next batch of notifications loads
- Text updates: "Showing 40 of [total] notifications" (or actual count)
- No duplicate notifications

---

### 8. Empty State

**Test**: Verify empty state displays correctly

**Setup**:
1. Login as a user with no notifications
2. Open notification drawer

**Expected Result**:
- Bell icon with empty state (no badge or "0")
- Drawer shows:
  - Large bell icon (gray)
  - Text: "No notifications yet"
  - No "Mark all as read" button

---

### 9. Real-time Polling

**Test**: Verify unread count updates automatically

**Setup**:
1. Login as User B
2. Note current unread count
3. In another browser/incognito, login as User A
4. Invite User B to a new project

**Steps**:
1. Wait up to 30 seconds (polling interval)

**Expected Result**:
- Badge count increases automatically
- No page refresh needed

---

### 10. Drawer Responsiveness

**Test**: Verify drawer works on mobile

**Steps**:
1. Resize browser to mobile width (< 768px)
2. Click notification bell

**Expected Result**:
- Drawer opens full width (100%)
- All functionality works
- Touch-friendly button sizes
- Scrolling works smoothly

---

### 11. Keyboard Navigation

**Test**: Verify ESC key closes drawer

**Steps**:
1. Open notification drawer
2. Press ESC key

**Expected Result**:
- Drawer closes
- Polling resumes
- Unread count refreshes

---

### 12. Multiple Notification Types

**Test**: Verify different notification types display correctly

**Setup**:
1. Manually create notifications of different types via backend:
   - project_invitation
   - task_assigned
   - payment_received
   - etc.

**Steps**:
1. Open notification drawer
2. Verify each notification displays with appropriate:
   - Title
   - Message
   - Action buttons (if applicable)
   - Timestamp

---

### 13. Notification Deletion (Optional)

**Test**: Verify notification can be deleted

**Note**: This feature may not be implemented in UI yet, test via API

**Steps**:
1. Use API client or cURL to delete a notification:
   ```bash
   DELETE /api/v1/notifications/:id
   ```

**Expected Result**:
- Notification removed from list
- Count updates accordingly

---

### 14. Filter Notifications (Optional)

**Test**: Verify filtering works

**Note**: This feature may not be implemented in UI yet, test via API

**Steps**:
1. Use API client to fetch with filters:
   ```
   GET /api/v1/notifications?filter=unread
   GET /api/v1/notifications?filter=read
   GET /api/v1/notifications?type=project_invitation
   ```

**Expected Result**:
- Only matching notifications returned

---

### 15. Concurrent Users

**Test**: Verify notifications work with multiple users

**Setup**:
1. Login as User A in Browser 1
2. Login as User B in Browser 2
3. Login as User C in Browser 3

**Steps**:
1. User A invites User B to Project 1
2. User A invites User C to Project 2
3. User B invites User C to Project 3

**Expected Result**:
- User B sees 1 notification (from User A)
- User C sees 2 notifications (from User A and User B)
- User A sees 0 notifications
- All counts are accurate
- No cross-contamination of notifications

---

### 16. Notification Persistence

**Test**: Verify notifications persist across sessions

**Steps**:
1. Login as user with unread notifications
2. Note the count
3. Logout
4. Login again

**Expected Result**:
- Same unread count displayed
- Same notifications visible in drawer
- Read/unread states preserved

---

### 17. Error Handling

**Test**: Verify graceful error handling

**Steps**:
1. Stop backend server
2. Open notification drawer
3. Try to mark notification as read

**Expected Result**:
- Error message displayed: "Failed to mark notification as read"
- UI doesn't crash
- Notification state doesn't change locally

**Steps (continued)**:
4. Restart backend server
5. Try again

**Expected Result**:
- Operation succeeds
- Error message cleared

---

### 18. Loading States

**Test**: Verify loading indicators display

**Steps**:
1. Open notification drawer (should show spinner initially)
2. Click "Mark all as read" (button should show loading state)
3. Click action button on notification (button should show loading state)

**Expected Result**:
- Appropriate loading indicators shown
- UI is disabled during loading
- Loading states clear after operation completes

---

### 19. Badge Display Edge Cases

**Test**: Verify badge displays correctly for various counts

**Test Cases**:
- 0 notifications: Badge hidden
- 1 notification: Badge shows "1"
- 50 notifications: Badge shows "50"
- 99 notifications: Badge shows "99"
- 100 notifications: Badge shows "99+"
- 150 notifications: Badge shows "99+"

---

### 20. Integration with Existing Invitation Flow

**Test**: Verify backward compatibility

**Steps**:
1. Invite a NEW user (not in organization) via email
2. Check that:
   - Email is sent (check console logs)
   - No notification created
   - Invitation created successfully

**Expected Result**:
- Email-based flow still works for new users
- In-app notifications only for existing users

---

## API Testing

### Manual API Tests

Use cURL or Postman to test the API endpoints directly:

```bash
# Get notifications
curl -X GET "http://localhost:58391/api/v1/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"

# Get unread count
curl -X GET "http://localhost:58391/api/v1/notifications/unread-count" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"

# Mark as read
curl -X PATCH "http://localhost:58391/api/v1/notifications/1/read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"

# Mark all as read
curl -X PATCH "http://localhost:58391/api/v1/notifications/mark-all-read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"

# Delete notification
curl -X DELETE "http://localhost:58391/api/v1/notifications/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-Slug: YOUR_TENANT_SLUG"
```

---

## Performance Testing

### Test Notification List Performance

1. Create 1000+ notifications for a user
2. Open notification drawer
3. Verify:
   - Initial load is fast (< 1 second)
   - Pagination works smoothly
   - No memory leaks
   - Scrolling is smooth

---

## Accessibility Testing

1. **Keyboard Navigation**:
   - Tab to notification bell
   - Press Enter to open drawer
   - Tab through notifications
   - Press ESC to close

2. **Screen Reader**:
   - Verify ARIA labels are present
   - Verify notifications are announced
   - Verify badge count is announced

---

## Browser Compatibility

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Mobile Chrome (Android)

---

## Known Issues / Limitations

- Notifications are polled every 30 seconds (not real-time)
- Badge shows "99+" for counts over 99
- Drawer pauses polling when open (resumes on close)

---

## Future Enhancements

- WebSocket for real-time notifications
- Sound/desktop notifications
- Notification preferences/settings
- Notification categories/filters in UI
- Mark as unread functionality
- Notification history page
- Email fallback option for existing users

