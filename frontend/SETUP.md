# SketchCue - Setup Guide

### 1. **Firebase Authentication**

- ✅ Email/Password sign-up and login
- ✅ Google OAuth sign-in
- ✅ Protected routes (auto-redirect to login if not authenticated)
- ✅ User session management with AuthContext
- ✅ Sign out functionality

### 2. **Canvas Drawing**

- ✅ Mouse drawing support
- ✅ Touch drawing support (mobile-friendly)
- ✅ Clear canvas button
- ✅ Save and analyze sketches

### 3. **AI Sketch Analysis**

- ✅ Google Gemini AI integration
- ✅ Real-time sketch description
- ✅ Save analyzed sketches to Firestore

### 4. **Sketch Gallery**

- ✅ View all saved sketches
- ✅ Sorted by timestamp (newest first)
- ✅ Responsive grid layout
- ✅ Protected route (login required)

### 5. **UI/UX**

- ✅ Responsive header with auth status
- ✅ Loading states
- ✅ Error handling
- ✅ Professional styling with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

Make sure you have a `.env` file in the `frontend` directory with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password + Google Sign-in)
3. Enable **Firestore Database** (start in test mode)
4. Enable **Storage** (start in test mode)
5. Copy your config to `.env`

### Running the App

```bash
# Install dependencies (if not already done)
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The app will be available at `http://localhost:3000`

## 📱 How to Use

### For New Users:

1. Navigate to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Sign up with email/password or use Google Sign-in
4. After login, you'll be redirected to the home page

### Creating a Sketch:

1. Use your mouse or finger to draw on the canvas
2. Click "Clear" to erase and start over
3. Click "Analyze Sketch" to get AI analysis
4. The sketch will be automatically saved to your account

### Viewing Your Sketches:

1. Click "My Sketches" in the header
2. View all your previously analyzed sketches
3. Each sketch shows the AI description and timestamp

## 🔧 Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **AI**: Google Gemini 2.5 Flash
- **Package Manager**: pnpm

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page with canvas
│   │   ├── login/page.tsx        # Login/Sign-up page
│   │   ├── sketches/page.tsx     # Gallery of saved sketches
│   │   ├── api/
│   │   │   ├── analyze/route.ts  # AI analysis endpoint
│   │   │   └── sketches/route.ts # Sketches API
│   │   └── layout.tsx            # Root layout with AuthProvider
│   ├── components/
│   │   ├── CanvasDraw.tsx        # Drawing canvas component
│   │   └── Header.tsx            # Navigation header
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication context
│   ├── lib/
│   │   ├── firebase.ts           # Firebase configuration
│   │   ├── sketch.ts             # Sketch saving logic
│   │   └── gemini.ts             # Gemini AI integration
│   └── functions/
│       └── index.js              # Firebase functions (if needed)
└── package.json
```

## 🐛 Fixed Issues

### 1. **Build Error: "Export Hands doesn't exist"**

- **Problem**: `@mediapipe/hands` package lacked proper ESM exports
- **Solution**: Switched to `@tensorflow-models/handpose` for pure TensorFlow.js implementation

### 2. **Canvas Not Drawing**

- **Problem**: Original implementation only showed hand detection video
- **Solution**: Implemented mouse/touch drawing with proper event handlers

### 3. **Missing Authentication**

- **Problem**: Login page was empty
- **Solution**: Created complete Firebase Auth integration with email/password and Google sign-in

### 4. **Unprotected Routes**

- **Problem**: Users could access pages without logging in
- **Solution**: Added AuthContext and route guards with automatic redirects

## 🔐 Security Notes

⚠️ **Important**: Update your Firestore and Storage security rules in production:

### Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sketches/{userId}/items/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎨 Customization

### Change Colors:

Edit `tailwind.config.ts` to customize the color scheme. The primary color is currently indigo.

### Adjust Rate Limiting:

In `src/lib/sketch.ts`, modify the `30 * 60 * 1000` (30 minutes) and `3` (max sketches) values.

### Canvas Size:

In `src/components/CanvasDraw.tsx`, change the `width` and `height` props on the canvas element.


## 🆘 Troubleshooting

### "No package.json found" error:

Make sure you're running commands from the `frontend` directory.

### Firebase errors:

1. Check your `.env` file has all required keys
2. Verify Firebase services are enabled in console
3. Check browser console for detailed error messages

### Canvas not working on mobile:

Make sure you have the `touch-none` class on the canvas to prevent scrolling.

### AI analysis failing:

1. Verify GEMINI_API_KEY is set in `.env`
2. Check your Gemini API quota
3. Ensure the image data is properly base64 encoded

## 📧 Support

If you encounter any issues, check:

1. Browser console for errors
2. Terminal output for server errors
3. Firebase Console for authentication/database errors

---
