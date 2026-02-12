# Test Resend Email Integration

## Quick Test

### Step 1: Start the Dev Server

```bash
npm run dev
```

The server should start on `http://localhost:3003`

### Step 2: Send Test Email

**Option A: Using PowerShell**
```powershell
$body = @{to = "yasha.afghan@gmail.com"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3003/api/v1/test/resend-email" -Method POST -Body $body -ContentType "application/json"
```

**Option B: Using curl (if available)**
```bash
curl -X POST http://localhost:3003/api/v1/test/resend-email \
  -H "Content-Type: application/json" \
  -d '{"to": "yasha.afghan@gmail.com"}'
```

**Option C: Using Browser/Postman**
- URL: `POST http://localhost:3003/api/v1/test/resend-email`
- Body (JSON):
```json
{
  "to": "yasha.afghan@gmail.com"
}
```

### Step 3: Check Response

You should receive a JSON response:
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "emailId": "re_xxxxx",
  "messageId": "re_xxxxx",
  "status": "sent",
  "unsubscribeToken": "xxxxx",
  "to": "yasha.afghan@gmail.com"
}
```

### Step 4: Check Your Email

Check the inbox at `yasha.afghan@gmail.com` for the test email.

## Troubleshooting

### Error: 500 Internal Server Error

1. **Check if dev server is running:**
   ```bash
   npm run dev
   ```

2. **Check environment variables:**
   - `RESEND_CS_SUPPORT_API_KEY` should be set
   - `RESEND_FROM_EMAIL` should be set
   - `RESEND_WEBHOOK_SECRET` should be set (for webhooks)

3. **Check server logs:**
   - Look for error messages in the terminal where `npm run dev` is running

### Error: Resend client not configured

- Make sure `RESEND_CS_SUPPORT_API_KEY` is set in `.env.local`
- Restart the dev server after adding environment variables

### Email Not Received

1. Check spam folder
2. Verify domain is verified in Resend dashboard
3. Check Resend dashboard for email status
4. Verify email address is correct

## Expected Email Features

The test email should include:
- ✅ HTML formatting
- ✅ Plain text version
- ✅ Compliance footer with unsubscribe link
- ✅ UTM parameters on links
- ✅ Proper subject line
