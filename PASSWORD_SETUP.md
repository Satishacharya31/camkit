# Password Setup System

This system allows secure password setup for admin users through specially generated links.

## 🔐 How it Works

1. **Admin Creation**: Backend generates admin user + secure password setup link
2. **Secure Link**: Link contains a cryptographically secure token (expires in 24h)
3. **Password Setup**: User visits link and sets their password securely
4. **Login**: User can then login with email/password at `/login`

## 🛠 API Endpoints

### Create Admin + Generate Password Link
```bash
POST /api/admin/grant-access
{
  "email": "admin@example.com",
  "name": "Admin Name",
  "generatePasswordLink": true
}
```

### Validate Password Setup Token
```bash
POST /api/auth/validate-token
{
  "token": "secure_token_here"
}
```

### Set Password
```bash
POST /api/auth/set-password
{
  "token": "secure_token_here",
  "password": "new_password"
}
```

## 📱 Pages

- **`/login`** - Unified login for all users (Google OAuth + Admin email/password)
- **`/auth/setup-password?token=xxx`** - Secure password setup page

## 🔒 Security Features

- ✅ Cryptographically secure tokens (32 bytes)
- ✅ 24-hour token expiration
- ✅ Single-use tokens (marked as used after password set)
- ✅ bcrypt password hashing
- ✅ Role + whitelist verification
- ✅ Token validation before password setting

## 📋 Database Schema

```sql
model PasswordSetupToken {
  id        String   @id @default(cuid())
  token     String   @unique
  email     String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🚀 Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install bcryptjs @types/bcryptjs
   ```

2. **Update database**:
   ```bash
   npx prisma db push
   ```

3. **Create admin user**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/grant-access \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "name": "Admin", "generatePasswordLink": true}'
   ```

4. **Use the returned password setup link** to set admin password

5. **Login at** `/login` with email and password

## 📝 Example Flow

```bash
# 1. Create admin and get setup link
curl -X POST localhost:3000/api/admin/grant-access \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "generatePasswordLink": true}'

# Response includes: passwordSetupLink: "https://domain.com/auth/setup-password?token=abc123..."

# 2. Admin visits the link and sets password (via UI)

# 3. Admin can now login at /login with email + password
```

## 🎨 UI Features

- **Modern Design**: Beautiful gradient backgrounds with glassmorphism effects
- **Responsive**: Works on all device sizes
- **Secure Forms**: Password validation and confirmation
- **Error Handling**: Clear error messages and validation
- **Loading States**: Smooth loading indicators
- **Auto-redirect**: Automatic redirects after successful operations