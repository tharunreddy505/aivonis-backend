# Testing the Account Dropdown and Change Password Feature

## Quick Test Steps

### 1. Check the User Dropdown in Sidebar
1. Open your browser and go to `http://localhost:3000`
2. Login if needed
3. Look at the **bottom of the sidebar** (left side)
4. You should see:
   - Your avatar with initials (e.g., "AU" for Admin User)
   - Your name and email below the avatar

### 2. Test the Dropdown Menu
1. **Click on your avatar/name** at the bottom of the sidebar
2. A dropdown menu should appear with:
   - ✅ Account
   - ✅ Terms and Conditions
   - ✅ Privacy Policy
   - ✅ Logout
3. Try clicking outside the dropdown - it should close
4. Click the avatar again to reopen it

### 3. Navigate to Account Page
1. Click on **"Account"** in the dropdown
2. You should be redirected to `/account`
3. You should see:
   - **Page Title**: "Account Settings"
   - **Profile Information Card** with:
     - Your avatar
     - Your name
     - Your email
     - Your role (Admin/Staff)
   - **Change Password Card** with:
     - Current Password field
     - New Password field
     - Confirm Password field
     - Save button

### 4. Test Change Password
1. Fill in the form:
   - **Current Password**: Enter your current password
   - **New Password**: Enter a new password (minimum 6 characters)
   - **Confirm Password**: Re-enter the new password
2. Click **"Save"**
3. You should see a green success message: "Password changed successfully"
4. Try logging out and logging back in with the new password

### 5. Test Validation
Try these scenarios to test validation:

#### Test 1: Empty Fields
- Leave all fields empty
- Click "Save"
- **Expected**: Red error message "All fields are required"

#### Test 2: Passwords Don't Match
- Current Password: `your_current_password`
- New Password: `newpass123`
- Confirm Password: `newpass456`
- Click "Save"
- **Expected**: Red error message "New passwords do not match"

#### Test 3: Password Too Short
- Current Password: `your_current_password`
- New Password: `123`
- Confirm Password: `123`
- Click "Save"
- **Expected**: Red error message "Password must be at least 6 characters long"

#### Test 4: Wrong Current Password
- Current Password: `wrongpassword`
- New Password: `newpass123`
- Confirm Password: `newpass123`
- Click "Save"
- **Expected**: Red error message "Current password is incorrect"

### 6. Test Other Pages
1. Click on your avatar again
2. Click **"Terms and Conditions"**
   - Should navigate to `/terms`
   - Should show terms page
3. Click on your avatar again
4. Click **"Privacy Policy"**
   - Should navigate to `/privacy`
   - Should show privacy policy page

### 7. Test Logout
1. Click on your avatar
2. Click **"Logout"**
3. You should be signed out and redirected to `/login`

## Troubleshooting

### Issue: Dropdown not showing at bottom of sidebar
**Solution**: 
- Make sure you're logged in
- Refresh the page (Ctrl+R or Cmd+R)
- Check browser console for errors (F12)

### Issue: Account page is blank
**Solution**:
- Check if you're logged in
- Look at the browser console for errors
- Make sure the dev server is running (`npm run dev`)

### Issue: Change password not working
**Solution**:
- Check browser console for API errors
- Verify your current password is correct
- Make sure PostgreSQL database is running
- Check terminal for server errors

### Issue: "Cannot find module" errors
**Solution**:
```bash
npm install
```

### Issue: TypeScript errors
**Solution**:
- The app should still run in development mode
- Check the terminal for specific error messages

## Expected Visual Appearance

### Sidebar Bottom Section:
```
┌─────────────────────────────────┐
│                                 │
│  [Navigation Items Above]       │
│                                 │
├─────────────────────────────────┤ ← Border separator
│                                 │
│  [AU]  Admin User               │
│        admin@aivonis.ai         │
│                                 │
└─────────────────────────────────┘
```

### Dropdown Menu (when clicked):
```
┌─────────────────────────────────┐
│  [AU]  Admin User               │
│        admin@aivonis.ai         │
├─────────────────────────────────┤
│  👤 Account                     │
│  📄 Terms and Conditions        │
│  🛡️ Privacy Policy              │
├─────────────────────────────────┤
│  🚪 Logout                      │
└─────────────────────────────────┘
```

### Account Page:
```
Account Settings
Manage your account information and security

┌─────────────────────────────────┐
│ 👤 Profile Information          │
├─────────────────────────────────┤
│                                 │
│  [AU]  Admin User               │
│        📧 admin@aivonis.ai      │
│        🛡️ Admin                 │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🔒 Change Password              │
├─────────────────────────────────┤
│                                 │
│  Current Password               │
│  [_______________]              │
│                                 │
│  New Password                   │
│  [_______________]              │
│                                 │
│  Confirm Password               │
│  [_______________]              │
│                                 │
│  [Save]                         │
│                                 │
└─────────────────────────────────┘
```

## Browser DevTools Check

If something isn't working:

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for any red error messages
4. Common errors and solutions:
   - `404 Not Found /api/auth/change-password` → API route not created
   - `Unauthorized` → Session expired, try logging in again
   - `Cannot read property of undefined` → Refresh the page

## Files to Check if Issues Persist

1. **Sidebar Component**: `src/components/Sidebar.tsx`
2. **Dropdown Component**: `src/components/UserAccountDropdown.tsx`
3. **Account Page**: `src/app/(dashboard)/account/page.tsx`
4. **API Route**: `src/app/api/auth/change-password/route.ts`
5. **Terms Page**: `src/app/(dashboard)/terms/page.tsx`
6. **Privacy Page**: `src/app/(dashboard)/privacy/page.tsx`

## Success Criteria

✅ User dropdown visible at bottom of sidebar
✅ Dropdown opens/closes on click
✅ All menu items navigate correctly
✅ Account page displays user information
✅ Change password form validates inputs
✅ Password change works successfully
✅ Error messages display correctly
✅ Success message shows after password change
✅ Logout works
✅ Terms and Privacy pages load

---

**Last Updated**: 2026-02-12
**Status**: Ready for testing
