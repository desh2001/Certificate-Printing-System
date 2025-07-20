# Google OAuth 2.0 Setup Guide

This guide will help you set up Google OAuth 2.0 authentication for the Certificate Printing System to upload files to Google Drive.

## Prerequisites

- Google account
- Google Cloud Platform access

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Certificate Printing System")
5. Click "Create"

### 2. Enable Google Drive API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "Certificate Printing System"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the remaining steps

4. Back in "Create OAuth client ID":
   - Application type: "Web application"
   - Name: "Certificate Printing System"
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Click "Create"

5. **Important**: Copy the Client ID and Client Secret - you'll need these for the .env file

### 4. Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and update these values:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   SESSION_SECRET=your_random_session_secret_here
   ```

3. Generate a random session secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 5. Test the Setup

1. Start the application:
   ```bash
   npm start
   ```

2. Open http://localhost:3000

3. Click "Sign in with Google"

4. You should be redirected to Google's consent screen

5. After authorization, you'll be redirected back to the application

## Troubleshooting

### Common Issues

**"Error: redirect_uri_mismatch"**
- Ensure the redirect URI in your OAuth client exactly matches: `http://localhost:3000/auth/google/callback`
- Check for extra spaces or typos

**"Error: invalid_client"**
- Verify your Client ID and Client Secret are correct
- Make sure you copied the entire values

**"Error: access_denied"**
- The user denied permission during the OAuth flow
- Try signing in again

**"Error: invalid_grant"**
- The authorization code has expired
- Try signing in again

### Production Deployment

For production deployment, you'll need to:

1. **Update OAuth Client**:
   - Add your production domain to authorized redirect URIs
   - Example: `https://yourdomain.com/auth/google/callback`

2. **Update Environment Variables**:
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
   SESSION_SECRET=your_production_session_secret
   ```

3. **Enable HTTPS**:
   - Set `cookie: { secure: true }` in the session configuration
   - Use a proper SSL certificate

4. **Domain Verification** (if needed):
   - Google may require domain verification for production OAuth apps
   - Follow Google's domain verification process

## Security Best Practices

1. **Never commit credentials**:
   - Keep your .env file out of version control
   - Use environment variables in production

2. **Rotate secrets regularly**:
   - Change your session secret periodically
   - Rotate OAuth client secrets if compromised

3. **Use HTTPS in production**:
   - Always use HTTPS for OAuth flows
   - Set secure cookies

4. **Limit scopes**:
   - The application only requests `https://www.googleapis.com/auth/drive.file`
   - This is the minimum scope needed for file uploads

## API Quotas and Limits

- **Google Drive API**: 10,000 requests per day (free tier)
- **File uploads**: 5TB per day per user
- **File size**: Up to 5TB per file

For most certificate generation use cases, these limits should be sufficient.

## Support

If you encounter issues:

1. Check the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
2. Verify your OAuth client configuration
3. Check the application logs for detailed error messages
4. Ensure all environment variables are properly set 