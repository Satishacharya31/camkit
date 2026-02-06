# Google OAuth Setup Guide

## Current Status
✅ **Basic Authentication Working**: The login system works with username/password  
🔄 **Google OAuth**: Requires setup of Google credentials  
✅ **Admin System**: Integrated with Neon database and admin whitelist  

## Quick Setup for Google OAuth

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Choose "Web application" as application type
7. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://glorious-space-spoon-r4p979445jxcw7rg-3000.app.github.dev/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```

   **⚠️ IMPORTANT**: If you're using GitHub Codespaces, you MUST add the specific Codespaces URL above!

### 2. Update Environment Variables

Add your credentials to `.env`:

```bash
# Replace with your actual Google OAuth credentials
GOOGLE_CLIENT_ID="your_actual_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_actual_google_client_secret_here"
```

### 3. Add Admin Users to Whitelist

Only users in the admin whitelist can access the admin panel:

```sql
-- Connect to your Neon database and run:
INSERT INTO "AdminWhitelist" (
  id, 
  email, 
  name, 
  "isActive", 
  "canManageUsers", 
  "canManageContent", 
  "canManageSettings", 
  notes, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'your-email@gmail.com',  -- Replace with your Google email
  'Your Name',
  true,
  true,
  true,
  false,
  'Added for Google OAuth access',
  NOW(),
  NOW()
);
```

## How It Works

1. **Google Sign-in**: Click "Continue with Google" on login page
2. **OAuth Flow**: Redirected to Google for authentication  
3. **Admin Check**: System checks if email is in AdminWhitelist
4. **Account Creation**: User account created automatically with admin role
5. **Dashboard Access**: Redirected to admin dashboard

## Features

- **Secure**: Only whitelisted emails get admin access
- **Automatic**: User accounts created on first Google sign-in
- **Integrated**: Works with existing Neon database setup
- **Fallback**: Username/password login still available

## Testing

1. Add your Google email to the admin whitelist (see step 3 above)
2. Set Google credentials in `.env` file  
3. Start the application: `npm run dev`
4. Go to `http://localhost:3000/login`
5. Click "Continue with Google"
6. Sign in with your Google account
7. Should redirect to admin dashboard

## Troubleshooting

### "client_id is required" Error
- Ensure `GOOGLE_CLIENT_ID` is set in `.env` file
- Restart the dev server after adding credentials

### Access Denied
- Check that your email is in the AdminWhitelist table
- Verify `isActive` is set to `true`

### Redirect URI Mismatch  
- Ensure redirect URI in Google Console matches exactly:
  - For local development: `http://localhost:3000/api/auth/callback/google`
  - For GitHub Codespaces: `https://glorious-space-spoon-r4p979445jxcw7rg-3000.app.github.dev/api/auth/callback/google`
  - For production: `https://yourdomain.com/api/auth/callback/google`

**Current Codespaces Error**: If you see the error with redirect URI `https://glorious-space-spoon-r4p979445jxcw7rg-3000.app.github.dev/api/auth/callback/google`, you need to add this exact URL to your Google Cloud Console OAuth configuration.

## Current Working Features

Even without Google OAuth, you can use:

✅ **Admin Login**: Use email/password authentication  
✅ **Content Management**: Full content CRUD operations  
✅ **User Management**: Admin whitelist system  
✅ **Neon Database**: Full database integration  

The system is fully functional - Google OAuth is just an additional convenience feature!

## Need Help?

The authentication system is working with username/password. Google OAuth is optional but provides a better user experience for whitelisted admin users.

---

## 🚨 Current GitHub Codespaces Issue

**Error**: "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy"

**Solution**: Add this exact redirect URI to your Google Cloud Console:
```
https://glorious-space-spoon-r4p979445jxcw7rg-3000.app.github.dev/api/auth/callback/google
```

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find OAuth client ID: `89366075015-nk7crcp3gsqs55fljk0n5qln5odp3phl`
4. Click edit (pencil icon)
5. Add the Codespaces redirect URI above to "Authorized redirect URIs"
6. Click "Save"
7. Try signing in again

**Note**: GitHub Codespaces URLs change each time you restart the environment, so you'll need to update this periodically.