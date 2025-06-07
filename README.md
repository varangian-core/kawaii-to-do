# Kawaii To-Do App

A beautiful, modern to-do application with drag-and-drop Kanban boards and customizable task backgrounds.

## Features

- ✨ Drag-and-drop Kanban board interface
- 🎨 Customizable task backgrounds with gradients or images
- 💾 Automatic local storage persistence
- 🎯 Smooth animations with Framer Motion
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

### Basic Features

1. **Add Tasks**: Click "+ Add Task" in any column
2. **Edit Tasks**: Double-click on any task text to edit
3. **Move Tasks**: Drag and drop tasks between columns
4. **Delete Tasks**: Click the 🗑️ button on any task
5. **Customize Background**: Click the 🎨 button on any task

### Managing Columns

- **Add Column**: Click "+ Add Column" on the right
- **Edit Column Title**: Double-click on the column title
- **Delete Column**: Click the × button in the column header

### Background Customization

The app comes with 8 built-in gradient backgrounds:
- Sunset, Ocean, Forest, Cherry
- Lavender, Mint, Peach, Sky

To add custom images:
1. Place image files in `public/images/abstract/` or `public/images/landscapes/`
2. Restart the dev server (the image manifest will be automatically generated)
3. Your images will appear in the image picker

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

## Technical Details

Built with:
- React 19
- TypeScript
- Vite
- Zustand (state management)
- Styled Components
- Framer Motion
- @dnd-kit (drag and drop)

Data is persisted locally using browser localStorage.
