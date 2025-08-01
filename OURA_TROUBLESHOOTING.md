# Oura OAuth Connection Troubleshooting Guide

## Issues Fixed

### 1. OAuth Token Exchange Format
**Problem**: The Oura API expects OAuth token exchange requests to be sent as `application/x-www-form-urlencoded` data, but the code was sending JSON.

**Solution**: Updated `ouraService.ts` to use `URLSearchParams` and set the correct `Content-Type` header.

### 2. Missing Environment Variables
**Problem**: No `.env` file was present, causing Oura API credentials to be undefined.

**Solution**: Created a setup script (`setup-env.js`) to help configure environment variables.

### 3. Duplicate OAuth Callback Routes
**Problem**: There were two different OAuth callback routes that could cause confusion.

**Solution**: Removed the duplicate route from `oura.ts` and kept only the one in `auth.ts`.

## Setup Instructions

### Step 1: Get Oura API Credentials
1. Go to [Oura Personal Access Tokens](https://cloud.ouraring.com/personal-access-tokens)
2. Create a new Personal Access Token
3. Note down the Client ID and Client Secret

### Step 2: Configure Environment Variables
Run the setup script:
```bash
node setup-env.js
```

Or manually create a `.env` file with:
```env
# Oura Ring API Configuration
OURA_CLIENT_ID=your-oura-client-id
OURA_CLIENT_SECRET=your-oura-client-secret
OURA_REDIRECT_URI=http://localhost:3001/api/auth/oura/callback
```

### Step 3: Configure Oura App Redirect URI
In your Oura app settings, make sure the redirect URI is set to:
```
http://localhost:3001/api/auth/oura/callback
```

### Step 4: Restart the Server
```bash
npm run dev
```

## Common Error Codes

### 400 Bad Request
- **Cause**: Invalid request format or missing parameters
- **Solution**: Check that environment variables are set correctly

### 401 Unauthorized
- **Cause**: Invalid client credentials
- **Solution**: Verify your Client ID and Client Secret

### 403 Forbidden
- **Cause**: Redirect URI mismatch
- **Solution**: Ensure redirect URI in Oura app matches `http://localhost:3001/api/auth/oura/callback`

## Debugging

### Check Environment Variables
The server logs will show whether environment variables are set:
```
Client ID: SET/NOT SET
Client Secret: SET/NOT SET
```

### Check OAuth Flow
1. Click "Connect Oura Ring" in the dashboard
2. Complete OAuth on Oura's website
3. Check server logs for detailed error messages
4. Check browser console for any frontend errors

### Test API Endpoints
```bash
# Check server health
curl http://localhost:3001/api/health

# Check Oura status (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/oura/status
```

## Still Having Issues?

1. **Check the logs**: Look for detailed error messages in the server console
2. **Verify Oura app settings**: Double-check redirect URI and scopes
3. **Test with Postman**: Try the OAuth flow manually to isolate the issue
4. **Check network**: Ensure no firewall is blocking the requests

## OAuth Flow Diagram

```
1. User clicks "Connect Oura Ring"
2. Frontend calls /api/oura/auth/url
3. Server returns Oura OAuth URL
4. User completes OAuth on Oura website
5. Oura redirects to /api/auth/oura/callback with code
6. Server exchanges code for tokens
7. Server redirects to frontend with success/error
8. Frontend updates connection status
``` 