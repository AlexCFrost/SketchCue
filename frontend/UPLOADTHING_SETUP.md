# UploadThing Setup Guide

This project uses **UploadThing** for handling sketch image uploads. Follow these steps to get your API token and configure the service.

## Step 1: Create an UploadThing Account

1. Go to **https://uploadthing.com/**
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with GitHub or your email address
4. Verify your email if required

## Step 2: Create a New App

1. After logging in, click **"Create App"** or **"New App"**
2. Enter an app name (e.g., "SketchCue")
3. Choose your region (select the region closest to your users)
4. Click **"Create"**

## Step 3: Get Your API Token

1. In your app dashboard, navigate to **"API Keys"** in the left sidebar
2. You'll see your **App ID** and **Secret Key**
3. Click **"Copy"** next to the Secret Key (this is your `UPLOADTHING_TOKEN`)
4. **Important**: Keep this secret key secure and never commit it to version control!

## Step 4: Add Token to Environment Variables

1. Open the `.env` file in the `frontend` directory
2. Add your UploadThing token:

```env
# UploadThing Configuration
UPLOADTHING_TOKEN=your_secret_key_here
```

3. Save the file
4. Restart your development server:

```bash
pnpm dev
```

## Step 5: Configure File Upload Settings (Optional)

By default, UploadThing allows:

- **Max file size**: 4MB per sketch
- **Max file count**: 1 file per upload
- **Allowed types**: Images (PNG)

To modify these settings, edit `/src/app/api/uploadthing/core.ts`:

```typescript
sketchUploader: f({
  image: {
    maxFileSize: "4MB", // Change this
    maxFileCount: 1, // Change this
  },
});
```

## Step 6: Verify Setup

1. Start your development server:

   ```bash
   cd frontend
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`
3. Log in to your account
4. Try drawing and analyzing a sketch
5. Check the console for upload confirmation:
   ```
   ✅ Sketch upload complete
     User: your-email@example.com
     File URL: https://...
   ```

## Troubleshooting

### Error: "Invalid token"

- Make sure you copied the **Secret Key**, not the App ID
- Verify the token is correctly added to `.env` with no extra spaces
- Restart your development server after adding the token

### Error: "Unauthorized"

- Ensure you're logged in with Firebase Authentication
- Check that the Firebase auth is working properly

### Upload Fails Silently

- Check browser console for detailed error messages
- Verify your file size is under 4MB
- Make sure the file is a valid image (PNG)

### Rate Limiting

- UploadThing free tier has usage limits
- Check your dashboard: https://uploadthing.com/dashboard
- Consider upgrading if you exceed limits

## UploadThing Dashboard

Access your dashboard to:

- View uploaded files
- Monitor usage and bandwidth
- Configure webhook events
- Manage API keys

Dashboard URL: **https://uploadthing.com/dashboard**

## Additional Resources

- [UploadThing Documentation](https://docs.uploadthing.com/)
- [Next.js Integration Guide](https://docs.uploadthing.com/getting-started/appdir)
- [API Reference](https://docs.uploadthing.com/api-reference)
- [Pricing](https://uploadthing.com/pricing)

## Security Notes

1. **Never commit your `UPLOADTHING_TOKEN` to version control**
2. The `.env` file is already in `.gitignore`
3. For production, add the token to your hosting platform's environment variables (Vercel, Netlify, etc.)
4. Consider setting up proper access control in the middleware function

## What's Next?

After setup is complete, you can:

- Customize upload limits and file types
- Add more file upload routes
- Implement custom file processing
- Set up webhooks for upload events
- Add progress indicators
- Implement file deletion functionality

---

Need help? Check the [UploadThing Discord](https://uploadthing.com/discord) or open an issue on GitHub.
