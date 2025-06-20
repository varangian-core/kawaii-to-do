# Kawaii To-Do 💕

A beautiful, kawaii-themed task management application with drag-and-drop functionality, user management, and progress tracking.

## Features ✨

- 📋 **Kanban Board** - Organize tasks in customizable columns
- 🎨 **Beautiful Backgrounds** - Add landscape images or gradients to your tasks
- 👥 **User Management** - Create users and assign tasks with drag-and-drop
- 📊 **Progress Tracking** - Circular progress indicators on each task
- 💕 **Kawaii Aesthetic** - Pink and purple theme with floating heart animations
- 🎯 **Edit Mode** - Clean interface with hidden controls until needed
- 💾 **Local Storage** - Your data persists between sessions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd kawaii-to-do
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase configuration:
```bash
# Copy the example file
cp src/lib/firebase.ts.example src/lib/firebase.ts

# Edit src/lib/firebase.ts and replace the placeholder values with your Firebase project credentials
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

### Basic Features

1. **Edit Mode**: Click "Edit Layout" button below the header to enable add buttons
2. **Add Tasks**: Click "+ Add Task" in any column
3. **Edit Tasks**: Double-click on any task text to edit
4. **Move Tasks**: Drag and drop tasks between columns
5. **Delete Tasks**: Click the 🗑️ button on any task
6. **Customize Background**: Click the 🎨 button on any task
7. **Track Progress**: Click the circular progress indicator to set completion percentage
8. **Batch Import**: Click 📥 in the header to import multiple tasks at once
9. **Batch Delete**: Click 🗑️ in the header to delete multiple tasks by name

### User Management

1. Enter Edit Mode (click "Edit Layout")
2. Click "+ Add User" to create a new user
3. Drag user badges onto tasks to assign them
4. Click on a user badge to make them the active user

### Managing Columns

1. Enter Edit Mode
2. **Add Column**: Click "+ Add Column" on the right
3. **Edit Column Title**: Double-click on the column title
4. **Delete Column**: Click the × button in the column header

### Background Customization

The app comes with 8 built-in gradient backgrounds:
- Sunset, Ocean, Forest, Cherry
- Lavender, Mint, Peach, Sky

To add custom images:
1. Place image files in `public/images/abstract/` or `public/images/landscapes/`
2. Restart the dev server (the image manifest will be automatically generated)
3. Your images will appear in the image picker

## Building for Production 🏗️

To create a production build:

```bash
npm run build
```

This will:
1. Generate the image manifest
2. Run TypeScript compilation
3. Build the optimized production bundle
4. Output files to the `dist` directory

## Firebase Configuration 🔥

### Setting up Firebase Credentials

The Firebase configuration is stored in `src/lib/firebase.ts` which is ignored by git for security reasons. To set up your Firebase credentials:

1. Copy the example configuration file:
```bash
cp src/lib/firebase.ts.example src/lib/firebase.ts
```

2. Get your Firebase configuration:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project (or create a new one)
   - Click the gear icon ⚙️ → Project Settings
   - Scroll down to "Your apps" → Web app
   - If no web app exists, click "Add app" and choose Web
   - Copy the configuration values

3. Edit `src/lib/firebase.ts` and replace the placeholder values with your actual Firebase credentials

⚠️ **Important**: The `src/lib/firebase.ts` file is git-ignored to keep your API keys secure. Never commit this file to version control.

## Firebase Deployment 🚀

### Initial Setup

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Create a new Firebase project (if you haven't already):
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"
   - Follow the setup wizard

4. The `.firebaserc` file is already configured with the project ID: `kawaiitodo-d8d42`

### Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy --only hosting
```

3. Your app will be available at:
   - `https://kawaiitodo-d8d42.web.app`
   - `https://kawaiitodo-d8d42.firebaseapp.com`

### Continuous Deployment (Optional)

For automatic deployments on git push:

1. Run Firebase init hosting:github:
```bash
firebase init hosting:github
```

2. Follow the prompts to set up GitHub Actions

## Development Scripts 📝

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Technologies Used 🛠️

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Styled Components** - CSS-in-JS styling
- **Framer Motion** - Animations
- **@dnd-kit** - Drag and drop
- **Firebase Hosting** - Deployment
- **Firebase Firestore** - Cloud database (when deployed)

## Data Storage 💾

The app uses a hybrid storage approach:
- **Local Development**: Uses browser localStorage (💾 icon in header)
- **Production (Firebase)**: Uses Firestore cloud database (☁️ icon in header)

This means your todos automatically sync across devices when using the deployed version!

### Data Protection Features

1. **Automatic Validation**: The app validates all data before saving to prevent corruption
2. **Local Backups**: Automatically keeps the 5 most recent local backups
3. **Google Drive Backup**: Manual and automatic backup to Google Drive

## Backup & Restore 💾

### Easy Backup System

The app includes a simple backup system that doesn't require any configuration:

1. **Download Backup**:
   - Click the 💾 button in the header
   - Click "Download Backup"
   - A JSON file will be downloaded with all your data
   - File is named with the current date for easy organization

2. **Restore from Backup**:
   - Click the 💾 button in the header
   - Click "Choose Backup File"
   - Select a previously downloaded backup file
   - Your data will be restored instantly

### What's Included in Backups

- ✅ All tasks and their content
- ✅ Task progress and assignments
- ✅ All columns and their order
- ✅ User profiles
- ✅ App settings (auto-delete, etc.)
- ✅ Background images and colors

### Preventing Data Loss

The app includes several safeguards against data loss:

1. **Auto-Delete Protection**: Auto-delete settings now persist between sessions
2. **Data Validation**: Prevents loading corrupt or empty data
3. **Backup Before Overwrite**: Creates local backup before saving new data
4. **Real-time Sync Protection**: Validates incoming data from Firebase

## License 📄

This project is open source and available under the [MIT License](LICENSE).

---

Made with 💕 by the Kawaii To-Do team
