# Kawaii To-Do: Architectural Design Document

**Version:** 1.0  
**Date:** June 6, 2025  
**Author:** Gemini

## 1. Vision & Guiding Principles

### 1.1. Application Vision

To create a delightful, modern, and visually rich to-do and task management application. The core user experience revolves around personalizing tasks with beautiful artwork, organizing them in a fluid Kanban interface, and enjoying a seamless, responsive interface packed with smooth animations.

### 1.2. Architectural Principles

- **Client-Side First:** The application must be fast, work offline, and be deployable as a static site. All core logic and data persistence will be handled in the browser, eliminating the need for a complex backend infrastructure.
- **Component-Driven:** The UI will be composed of small, reusable, and well-defined React components, promoting maintainability and scalability.
- **State-Driven UI:** The user interface will be a direct reflection of the application's state. All data flows in a single, predictable direction.
- **Delightful UX:** Performance, fluid animations, and intuitive interactions are not afterthoughts; they are core requirements.
- **Simplified Asset Management:** The process for adding and managing background images and other art assets must be simple and automated, requiring minimal developer intervention.

## 2. System Architecture

The application employs a Single-Page Application (SPA) architecture, running entirely on the client-side. There is no backend server for application logic or database management. Data persistence is achieved using the browser's Local Storage, and all assets are static files served alongside the application.

## 3. Technology Stack

| Category | Technology | Justification |
|----------|------------|---------------|
| UI Framework | React | Industry-standard for building component-based, declarative UIs. |
| Language | TypeScript | Provides static typing, improving code quality, developer experience, and reducing runtime errors. |
| Build Tool | Vite | Offers near-instantaneous hot module replacement (HMR) for a rapid development cycle and optimized builds for production. |
| Styling | Styled Components | Enables component-level styling with the full power of CSS in JS, perfect for dynamically theming components (e.g., setting background images). |
| Animation | Framer Motion | A production-ready, declarative animation library for React that makes creating complex, fluid animations simple. |
| State Management | Zustand | A minimal, fast, and scalable state management solution that is unopinionated and easy to integrate with React hooks. |
| Drag & Drop | dnd-kit | A modern, lightweight, and highly performant toolkit for building accessible drag-and-drop interfaces. |
| Data Persistence | Browser Local Storage | A simple, universally available API for storing key-value pairs persistently in the browser. Ideal for a self-contained, client-side app. |

## 4. Detailed Architecture & Design

### 4.1. Folder Structure

A well-organized folder structure is critical for maintainability.

```
/
├── public/
│   ├── images/
│   │   ├── abstract/
│   │   └── landscapes/
│   └── images.json        # Auto-generated image manifest
├── scripts/
│   └── generate-image-manifest.js # Script to generate images.json
├── src/
│   ├── assets/              # Global assets like icons, fonts
│   ├── components/
│   │   ├── common/            # Shared components (Button, Modal, Input)
│   │   ├── layout/            # Layout components (Header, Sidebar, PageWrapper)
│   │   ├── board/             # Kanban board components (Board, Column, Card)
│   │   ├── ImagePicker/       # Image selection modal and its parts
│   │   └── ToDo/              # To-do item components
│   ├── hooks/               # Custom React hooks (e.g., useLocalStorage)
│   ├── lib/                 # Utility functions, type definitions
│   ├── store/               # Zustand state management stores
│   │   ├── boardStore.ts
│   │   └── uiStore.ts
│   └── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── .eslintrc.cjs
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 4.2. State Management (Zustand)

We will utilize multiple stores to separate concerns.

**boardStore.ts:** Manages the core data of the application.

```typescript
// src/store/boardStore.ts
export interface ToDo {
  id: string;
  content: string;
  backgroundImageUrl?: string; // Path to the selected image
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardState {
  tasks: Record<string, ToDo>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

// Actions will include:
// addTask, updateTask, deleteTask, setBoardState, moveTask, etc.
```

**uiStore.ts:** Manages the UI state, such as open modals or loading states.

```typescript
// src/store/uiStore.ts
export interface UIState {
  isImagePickerOpen: boolean;
  imagePickerTargetId: string | null; // Which task is being customized
}

// Actions will include:
// openImagePicker, closeImagePicker
```

### 4.3. Data Persistence & Flow

- **Initialization:** On application load, a `useAppInitializer` hook attempts to read the serialized board state from Local Storage.
- **Hydration:** If data exists, it's parsed and used to hydrate the `boardStore`. If not, the store is initialized with a default empty state.
- **Updates:** All user actions (e.g., adding a task, dragging a card) call action functions defined in the Zustand store.
- **Serialization:** The `boardStore` subscribes to its own changes. Whenever the state is updated, a debounced function serializes the entire board state to a JSON string and saves it back to Local Storage under a specific key (e.g., `kawaii-todo-board`). This ensures data is always saved without blocking the UI thread on every minor change.

### 4.4. Component Architecture

- **App.tsx:** The root component. Responsible for initialization and routing (if ever needed).
- **KanbanBoard.tsx:** The main container for the Kanban view. It will use dnd-kit's `<DndContext>` and will render the columns.
- **Column.tsx:** Renders a single column and the tasks within it. It will be a droppable area.
- **ToDoCard.tsx:** Renders an individual task card. It will be a draggable item. This component will dynamically apply the `backgroundImageUrl` from its state using Styled Components. It will also have a button to trigger the `uiStore.openImagePicker` action.
- **ImagePickerModal.tsx:** A modal component that appears when `uiStore.isImagePickerOpen` is true.
  - On mount, it fetches `/images.json`.
  - It renders a gallery of images, grouped by category.
  - When an image is selected, it calls the `boardStore.updateTask` action with the target task ID and the selected image path.

### 4.5. Asset Management Automation

The image management system is designed to be zero-maintenance.

1. **Developer Action:** The developer simply adds a new image file (e.g., `new-art.png`) into a relevant sub-directory within `public/images/`.
2. **Automation:** Before starting the dev server (`npm run dev`), a `predev` script in `package.json` executes `node scripts/generate-image-manifest.js`.
3. **Manifest Generation:** This script traverses the `public/images` directory, builds a structured JSON object representing the "folders" (directories) and their contents, and saves it as `public/images.json`.
4. **UI Consumption:** The `ImagePickerModal` component can now fetch this updated manifest and display the new image in the selection UI without any code changes.

## 5. Deployment Strategy

1. **Build:** Run `npm run build`. Vite will bundle all TypeScript/React code, and CSS into highly optimized static HTML, CSS, and JavaScript files in the `/dist` directory.
2. **Deploy:** The contents of the `/dist` directory, along with the entire `/public` directory, can be deployed to any static web hosting provider (e.g., Netlify, Vercel, GitHub Pages).

This architecture provides a robust, scalable, and developer-friendly foundation for building the Kawaii To-Do application, prioritizing a rich user experience and simplicity of maintenance.