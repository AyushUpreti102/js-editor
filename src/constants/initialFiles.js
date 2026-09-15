export const DEFAULT_STYLES_CSS_CONTENT = `:root {
  --bg-color: #0b0f19;
  --card-bg: #131b2e;
  --card-border: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent: #38bdf8;
  --accent-glow: rgba(56, 189, 248, 0.15);
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg-color);
  color: var(--text-main);
  line-height: 1.6;
  padding: 32px 20px;
  min-height: 100vh;
}

.guide-container {
  max-width: 680px;
  margin: 0 auto;
}

header {
  text-align: center;
  margin-bottom: 32px;
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--accent-glow);
  color: var(--accent);
  border: 1px solid rgba(56, 189, 248, 0.3);
  margin-bottom: 12px;
}

h1 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #ffffff;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 15px;
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 28px;
}

.guide-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.guide-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.card-icon {
  font-size: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.guide-card p {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 12px;
}

ul.feature-list {
  list-style: none;
  padding-left: 0;
}

ul.feature-list li {
  color: var(--text-muted);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

ul.feature-list li::before {
  content: '•';
  color: var(--accent);
  font-weight: bold;
  font-size: 16px;
}

kbd {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  color: #f1f5f9;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.interactive-section {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.interactive-section h3 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #ffffff;
}

.interactive-section p {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

button.interactive-btn {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

button.btn-log {
  background: #0284c7;
  color: #ffffff;
}
button.btn-log:hover {
  background: #0369a1;
}

button.btn-warn {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}
button.btn-warn:hover {
  background: rgba(245, 158, 11, 0.25);
}

button.btn-error {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}
button.btn-error:hover {
  background: rgba(239, 68, 68, 0.25);
}

button.btn-info {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-color: rgba(56, 189, 248, 0.3);
}
button.btn-info:hover {
  background: rgba(56, 189, 248, 0.25);
}
`

export const DEFAULT_INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JS Editor — Getting Started Guide</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="guide-container">
      <header>
        <span class="badge">Getting Started Guide</span>
        <h1>Welcome to JS Editor 🚀</h1>
        <p class="subtitle">Your lightweight, interactive in-browser coding playground</p>
      </header>

      <div class="card-grid">
        <!-- 1. Managing Files & Explorer -->
        <div class="guide-card">
          <div class="card-header">
            <span class="card-icon">📁</span>
            <span class="card-title">1. Workspace & File Explorer</span>
          </div>
          <p>Organize your project with the virtual file tree in the left sidebar:</p>
          <ul class="feature-list">
            <li>Click <strong>New File</strong> or <strong>New Folder</strong> in the explorer header.</li>
            <li>Right-click any item for <strong>Rename</strong>, <strong>Delete</strong>, or <strong>Copy Path</strong>.</li>
            <li>Use the Activity Bar to toggle between <strong>File Explorer</strong> and <strong>Search in Files</strong>.</li>
            <li>Changes are automatically saved in local storage.</li>
          </ul>
        </div>

        <!-- 2. Menus & Workspace Export -->
        <div class="guide-card">
          <div class="card-header">
            <span class="card-icon">💾</span>
            <span class="card-title">2. Desktop Menus & ZIP Export</span>
          </div>
          <p>Full-featured desktop menu bar in the titlebar:</p>
          <ul class="feature-list">
            <li><strong>File &gt; Save (<kbd>Cmd+S</kbd> / <kbd>Ctrl+S</kbd>)</strong>: Packages and exports the workspace into a downloadable <code>.zip</code>.</li>
            <li><strong>Edit</strong>: Undo, Redo, Cut, Copy, Paste, Find & Replace, and Commenting.</li>
            <li><strong>Selection</strong>: Select All, Duplicate Selection, Copy/Move Lines, and Multi-Cursors.</li>
            <li><strong>View &amp; Go</strong>: Toggle sidebars, console, and jump to line, bracket, or definition.</li>
            <li><strong>Run</strong>: Run directly on console or launch with live preview.</li>
          </ul>
        </div>

        <!-- 3. Quick File Search -->
        <div class="guide-card">
          <div class="card-header">
            <span class="card-icon">🔍</span>
            <span class="card-title">3. Quick Open & File Search</span>
          </div>
          <p>Instant fuzzy file navigation across your entire workspace:</p>
          <ul class="feature-list">
            <li>Click the search pill in the titlebar or press <kbd>Cmd+P</kbd> / <kbd>Ctrl+P</kbd>.</li>
            <li>Search files by name or folder path with real-time matching highlights.</li>
            <li>Navigate with <kbd>↑</kbd> and <kbd>↓</kbd> arrow keys, press <kbd>Enter</kbd> to open.</li>
          </ul>
        </div>

        <!-- 4. Live Preview & Console -->
        <div class="guide-card">
          <div class="card-header">
            <span class="card-icon">⚡</span>
            <span class="card-title">4. Live Preview & Integrated Console</span>
          </div>
          <p>Run web code in real-time with full console output routing:</p>
          <ul class="feature-list">
            <li>Click <strong>Live Preview</strong> in the bottom status bar or press <kbd>F5</kbd> to open the live preview.</li>
            <li>Linked local stylesheets and scripts are automatically bundled and inlined.</li>
            <li>Toggle the bottom Console Drawer with <kbd>Cmd+J</kbd> / <kbd>Ctrl+J</kbd> to view logs in real-time.</li>
          </ul>
        </div>

        <!-- 5. Essential Shortcuts -->
        <div class="guide-card">
          <div class="card-header">
            <span class="card-icon">⌨️</span>
            <span class="card-title">5. Essential Shortcuts</span>
          </div>
          <ul class="feature-list">
            <li><kbd>F5</kbd> — Run in Live Preview (or Console for JS)</li>
            <li><kbd>Cmd / Ctrl + S</kbd> — Save &amp; export workspace to ZIP</li>
            <li><kbd>Cmd / Ctrl + P</kbd> — Quick file search / Command palette</li>
            <li><kbd>Cmd / Ctrl + B</kbd> — Toggle primary sidebar</li>
            <li><kbd>Cmd / Ctrl + J</kbd> — Toggle bottom console drawer</li>
            <li><kbd>Cmd / Ctrl + Shift + F</kbd> — Search in files</li>
            <li><kbd>Esc</kbd> — Dismiss open dialogs, menus, or search palette</li>
          </ul>
        </div>
      </div>

      <!-- 6. Interactive Console Sandbox -->
      <div class="interactive-section">
        <h3>🧪 Test the Integrated Console</h3>
        <p>Click any button below to stream live logs into your IDE Console Drawer (<kbd>Cmd + J</kbd>):</p>
        <div class="btn-group">
          <button class="interactive-btn btn-log" onclick="console.log('Standard log from index.html at ' + new Date().toLocaleTimeString())">
            console.log()
          </button>
          <button class="interactive-btn btn-info" onclick="console.info('Helpful tip: You can drag to resize the bottom console!')">
            console.info()
          </button>
          <button class="interactive-btn btn-warn" onclick="console.warn('Warning: Resource will be deprecated in next release')">
            console.warn()
          </button>
          <button class="interactive-btn btn-error" onclick="console.error('Error: Simulated syntax error test')">
            console.error()
          </button>
        </div>
      </div>
    </div>
    <script src="main.js"></script>
  </body>
</html>`

export const DEFAULT_MAIN_JS_CONTENT = `console.log('Hello from main.js!')
`

export const DEFAULT_FILES_MAP = [
  { id: 'index-html', name: 'index.html', type: 'file', parentId: null },
  { id: 'styles-css', name: 'styles.css', type: 'file', parentId: null },
  { id: 'main-js', name: 'main.js', type: 'file', parentId: null },
]

export const DEFAULT_FILE_CONTENT_MAP = {
  'index-html': {
    id: 'index-html',
    name: 'index.html',
    language: 'html',
    content: DEFAULT_INDEX_HTML_CONTENT,
  },
  'styles-css': {
    id: 'styles-css',
    name: 'styles.css',
    language: 'css',
    content: DEFAULT_STYLES_CSS_CONTENT,
  },
  'main-js': {
    id: 'main-js',
    name: 'main.js',
    language: 'javascript',
    content: DEFAULT_MAIN_JS_CONTENT,
  },
}

