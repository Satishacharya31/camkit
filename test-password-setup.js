#!/usr/bin/env node

// Test script for password setup system
// This demonstrates how to use the APIs

const API_BASE = 'http://localhost:3000/api'

async function testPasswordSetupSystem() {
  console.log('🧪 Testing Password Setup System\n')

  // Check if fetch is available (Node 18+)
  if (typeof fetch === 'undefined') {
    console.log('⚠️  This script requires Node.js 18+ or you can install node-fetch')
    console.log('Alternative: Use curl commands shown below instead.')
    return
  }

  try {
    // Step 1: Grant admin access and generate password setup link
    console.log('1️⃣ Creating admin user and generating password setup link...')
    
    const grantResponse = await fetch(`${API_BASE}/admin/grant-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        name: 'Test Admin',
        generatePasswordLink: true
      })
    })

    if (!grantResponse.ok) {
      const errorData = await grantResponse.json()
      throw new Error(`Failed to grant access: ${grantResponse.statusText} - ${errorData.error || ''}`)
    }

    const grantData = await grantResponse.json()
    console.log('✅ Admin user created!')
    console.log(`🔗 Password setup link: ${grantData.passwordSetupLink}`)
    console.log('')

    // Step 2: Validate the token (simulate what the page does)
    const token = grantData.passwordSetupLink.split('token=')[1]
    console.log('2️⃣ Validating token...')
    
    const validateResponse = await fetch(`${API_BASE}/auth/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    if (!validateResponse.ok) {
      throw new Error(`Token validation failed: ${validateResponse.statusText}`)
    }

    const validateData = await validateResponse.json()
    console.log('✅ Token is valid!')
    console.log(`📧 Email: ${validateData.email}`)
    console.log(`⏰ Expires at: ${new Date(validateData.expiresAt).toLocaleString()}`)
    console.log('')

    // Step 3: Set password (simulate form submission) - COMMENTED OUT for safety
    console.log('3️⃣ Setting password (simulated)...')
    console.log('⚠️  Password setting simulation skipped for security')
    console.log('🔓 You can now visit the password setup link to set the password')
    console.log('')

    console.log('✨ Test completed successfully!')
    console.log('📱 Next steps:')
    console.log(`   1. Visit: ${grantData.passwordSetupLink}`)
    console.log('   2. Set your admin password')
    console.log('   3. Login at /login with email and password')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Usage examples
console.log(`
🔧 Content Hub Admin Setup

To create an admin user with password setup link:

curl -X POST http://localhost:3000/api/admin/grant-access \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@example.com",
    "name": "Admin User",
    "generatePasswordLink": true
  }'

The response will include a passwordSetupLink that the admin can use to set their password.

⚠️  Security Notes:
- Password setup links expire in 24 hours
- Each link can only be used once
- Tokens are cryptographically secure
- Passwords are hashed with bcrypt

`)

// Run test if this script is executed directly
if (require.main === module) {
  testPasswordSetupSystem()
}