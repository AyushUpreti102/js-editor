# JS Editor

A lightweight, modern web-based in-browser code editor and live playground built with Vue 3, Pinia, Monaco Editor, and @vueuse/core.

## Features

- **Multi-File Workspace**: Create, rename, delete, and organize files and folders with an integrated File Explorer.
- **Desktop Menus**: Native-grade titlebar dropdown menus for **File** (Save & Export ZIP), **Edit** (Undo, Redo, Cut, Copy, Paste, Comments), **Selection** (Select all, Duplicate, Move/Copy lines, Multi-cursors), **View** (Sidebars, Search, Console), **Go** (Line/Column, Bracket, Definition), and **Run** (Console & Preview).
- **Quick File Search (Cmd+P)**: Fast fuzzy filename and directory path search modal with keyboard navigation.
- **Search & Replace Panel**: Project-wide text search and single/all replacement with regex, case-sensitive, and whole-word toggles.
- **Workspace ZIP Export (Cmd+S)**: Instantly package and download your entire virtual workspace into a `.zip` archive.
- **Monaco Code Editor**: Syntax highlighting, code folding, smooth scrolling, multiple cursors, and custom dark theme.
- **Live Preview Sandbox**: Run web code with real-time HTML/CSS/JS inlining and interactive iframe execution, toggled cleanly from the StatusBar.
- **Integrated Console**: Capture `console.log`, `console.info`, `console.warn`, and `console.error` directly from sandboxes into a bottom console drawer.
- **Keyboard Shortcuts**:
  - `F5`: Run project (Live Preview for HTML, Console for JS)
  - `Cmd + S` / `Ctrl + S`: Save & export workspace as ZIP
  - `Cmd + P` / `Ctrl + P`: Quick file search / Command palette
  - `Cmd + B` / `Ctrl + B`: Toggle primary sidebar
  - `Cmd + J` / `Ctrl + J`: Toggle console drawer
  - `Cmd + Shift + F` / `Ctrl + Shift + F`: Search across all workspace files
  - `Escape`: Close modals, dismiss menus, or cancel renaming
- **Persistent State**: Automatic local storage caching of open tabs, active document, file hierarchy, and layout preferences via `@vueuse/core`.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Code Quality and Linting

```sh
npm run lint
npm run format
```

## Architecture & Technology Stack

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **State Management**: Pinia
- **Editor Engine**: `monaco-editor`
- **Utilities**: `@vueuse/core`
- **Icons**: `@lucide/vue`
- **Build Tool**: Vite
