# Forgot Password Setup Instructions

## 🎯 Overview
This guide explains how to set up the forgot password functionality in your Trakory application.

## 🗄️ Database Setup

### 1. Create the password_resets table
Run the SQL script in `backend/sql/password_resets.sql`:

```sql
-- Create password_resets table for handling password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);
```

You can run this by:
- Using MySQL Workbench or phpMyAdmin
- Command line: `mysql -u your_username -p your_database < backend/sql/password_resets.sql`

## 📧 Email Configuration

### 1. Set up environment variables
Copy `backend/env-example.txt` to create your `.env` file with these values:

```env
# Email Configuration (for password reset emails)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended)
If using Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (custom name)"
   - Enter "Trakory App" as the name
   - Copy the generated 16-character password
   - Use this as your `EMAIL_PASSWORD` in .env

### 3. Other Email Services
You can also use:
- **Outlook**: Set `EMAIL_SERVICE=hotmail`
- **Yahoo**: Set `EMAIL_SERVICE=yahoo`
- **Custom SMTP**: Modify the transporter in `backend/utils/email-service.js`

## 🚀 Dependencies

### Backend
Make sure you have nodemailer installed:
```bash
cd backend
npm install nodemailer
```

The following packages are already included:
- `crypto` (built-in Node.js module)
- `bcryptjs` (already installed)

## 🧪 Testing the Functionality

### 1. Start your servers
```bash
# Backend
cd backend
npm start

# Frontend  
cd ..
npm run dev
```

### 2. Test the flow
1. Go to login page: `http://localhost:3000/auth/boxed-signin`
2. Click "Forgot Password?" link
3. Enter a registered email address
4. Check your email for the reset link
5. Click the reset link and enter a new password

### 3. API Endpoints
- **POST** `/forgot-password` - Send reset email
- **POST** `/reset-password` - Reset password with token
- **GET** `/verify-reset-token/:token` - Verify if token is valid

## 🔒 Security Features

- ✅ Tokens expire after 1 hour
- ✅ Tokens can only be used once
- ✅ Secure random token generation
- ✅ Password hashing with bcrypt
- ✅ Rate limiting protection (email doesn't reveal if user exists)
- ✅ HTTPS-ready email templates

## 🎨 Frontend Routes

New routes added:
- `/auth/forgot-password` - Forgot password form
- `/auth/reset-password?token=xxx` - Reset password form

## 🐛 Troubleshooting

### Email not sending?
1. Check your email credentials in `.env`
2. Verify Gmail app password is correct
3. Check server logs for email errors
4. Test with a simple email first

### Token invalid/expired?
1. Tokens expire after 1 hour
2. Tokens can only be used once
3. Check database `password_resets` table for valid entries

### Database errors?
1. Ensure `password_resets` table exists
2. Check database connection in `backend/config/db.js`
3. Verify user exists in `users` table

## 📱 Features

### Forgot Password Page
- ✅ Email validation
- ✅ Loading states
- ✅ Success/error messages
- ✅ Beautiful UI with animations
- ✅ Link back to login

### Reset Password Page
- ✅ Token verification
- ✅ Password strength indicators
- ✅ Confirm password matching
- ✅ Show/hide password toggles
- ✅ Success confirmation

### Email Template
- ✅ Professional HTML design
- ✅ Mobile-responsive
- ✅ Security warnings
- ✅ Fallback text version

## 🔧 Customization

### Email Templates
Edit `backend/utils/email-service.js` to customize:
- Email styling
- Company branding
- Message content
- Email service provider

### Token Expiration
Change token expiry time in `backend/routes/auth-routes.js`:
```javascript
const expiresAt = new Date(Date.now() + 3600000); // 1 hour
```

### Password Requirements
Modify validation in both frontend and backend:
- Minimum length
- Complexity requirements
- Special characters

## 🎉 You're Ready!

Your forgot password functionality is now complete with:
- ✅ Secure token-based reset system
- ✅ Professional email templates
- ✅ Beautiful UI components
- ✅ Comprehensive error handling
- ✅ Mobile-responsive design

Users can now safely reset their passwords if they forget them!
