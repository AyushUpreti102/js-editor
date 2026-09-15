<template>
  <header class="app-titlebar">
    <div class="titlebar-left">
      <span class="logo-badge">JS</span>

      <!-- Interactive Desktop Menu Bar -->
      <nav ref="menuBarRef" class="titlebar-menu" aria-label="Main menu">
        <div
          v-for="menu in menuList"
          :key="menu.name"
          class="menu-item-wrapper"
          :class="{ open: openMenuKey === menu.name }"
        >
          <button
            class="menu-trigger"
            :class="{ active: openMenuKey === menu.name }"
            type="button"
            :aria-expanded="openMenuKey === menu.name"
            @click="toggleMenu(menu.name)"
            @mouseenter="handleMenuHover(menu.name)"
          >
            {{ menu.name }}
          </button>

          <!-- Dropdown Popover -->
          <div
            v-if="openMenuKey === menu.name"
            class="menu-dropdown"
            role="menu"
            @click.stop
          >
            <template v-for="(item, idx) in menu.items" :key="idx">
              <div v-if="item.separator" class="menu-divider" role="separator"></div>
              <button
                v-else
                class="menu-action"
                type="button"
                role="menuitem"
                @click="executeMenuItem(item)"
              >
                <span class="action-label">{{ item.label }}</span>
                <span v-if="item.shortcut" class="action-shortcut">{{ item.shortcut }}</span>
              </button>
            </template>
          </div>
        </div>
      </nav>
    </div>

    <!-- Command Palette Pill (Quick Open) -->
    <div class="titlebar-center">
      <div
        class="command-palette-pill"
        title="Open Command Palette (Cmd+P)"
        @click="handleCommandPaletteClick"
      >
        <IconSearch :size="13" />
        <span class="palette-title">js-editor — {{ activeFileName || 'Editor' }}</span>
        <kbd class="shortcut-badge">{{ isMac ? '⌘P' : 'Ctrl+P' }}</kbd>
      </div>
    </div>

    <!-- Titlebar Right Controls -->
    <div class="titlebar-right">
      <button
        class="titlebar-btn"
        :class="{ active: isConsoleOpen }"
        title="Toggle Bottom Console / Terminal (Cmd+J)"
        @click="$emit('toggle-console')"
      >
        <IconTerminal :size="15" />
      </button>

      <button
        class="titlebar-btn"
        :class="{ active: isSidebarOpen }"
        title="Toggle Primary Sidebar (Cmd+B)"
        @click="$emit('toggle-sidebar')"
      >
        <IconSidebar :size="15" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { IconSearch, IconTerminal, IconSidebar } from '@/components/icons'
import { useEditorStore } from '@/stores/editorStore'

defineProps({
  activeFileName: {
    type: String,
    default: 'index.html',
  },
  isSidebarOpen: {
    type: Boolean,
    default: true,
  },
  isConsoleOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'toggle-sidebar',
  'toggle-console',
  'open-file-search',
  'save-workspace',
  'open-search',
  'open-replace',
  'toggle-search',
  'run',
])

const editorStore = useEditorStore()

const menuBarRef = ref(null)
const openMenuKey = ref(null)

const isMac = computed(() => {
  return (
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent))
  )
})

// Dismiss menus on outside click or Escape
onClickOutside(menuBarRef, () => {
  openMenuKey.value = null
})

onKeyStroke('Escape', () => {
  openMenuKey.value = null
})

const toggleMenu = (name) => {
  openMenuKey.value = openMenuKey.value === name ? null : name
}

const handleMenuHover = (name) => {
  if (openMenuKey.value !== null) {
    openMenuKey.value = name
  }
}

const executeMenuItem = (item) => {
  openMenuKey.value = null
  if (typeof item.action === 'function') {
    item.action()
  }
}

const handleCommandPaletteClick = () => {
  openMenuKey.value = null
  emit('open-file-search')
}

// Menu structure definitions
const menuList = computed(() => {
  const mac = isMac.value

  return [
    {
      name: 'File',
      items: [
        {
          label: 'Save',
          shortcut: mac ? '⌘S' : 'Ctrl+S',
          action: () => emit('save-workspace'),
        },
      ],
    },
    {
      name: 'Edit',
      items: [
        {
          label: 'Undo',
          shortcut: mac ? '⌘Z' : 'Ctrl+Z',
          action: () => editorStore.undo(),
        },
        {
          label: 'Redo',
          shortcut: mac ? '⇧⌘Z' : 'Ctrl+Shift+Z',
          action: () => editorStore.redo(),
        },
        { separator: true },
        {
          label: 'Cut',
          shortcut: mac ? '⌘X' : 'Ctrl+X',
          action: () => editorStore.cut(),
        },
        {
          label: 'Copy',
          shortcut: mac ? '⌘C' : 'Ctrl+C',
          action: () => editorStore.copy(),
        },
        {
          label: 'Paste',
          shortcut: mac ? '⌘V' : 'Ctrl+V',
          action: () => editorStore.paste(),
        },
        { separator: true },
        {
          label: 'Find & Replace',
          shortcut: mac ? '⌥⌘F' : 'Ctrl+H',
          action: () => editorStore.executeAction('editor.action.startFindReplaceAction'),
        },
        {
          label: 'Find in files',
          shortcut: mac ? '⇧⌘F' : 'Ctrl+Shift+F',
          action: () => emit('open-search'),
        },
        {
          label: 'Replace in files',
          shortcut: mac ? '⇧⌘H' : 'Ctrl+Shift+H',
          action: () => emit('open-replace'),
        },
        { separator: true },
        {
          label: 'Toggle Line Comment',
          shortcut: mac ? '⌘/' : 'Ctrl+/',
          action: () => editorStore.executeAction('editor.action.commentLine'),
        },
        {
          label: 'Toggle Block Comment',
          shortcut: mac ? '⇧⌥A' : 'Shift+Alt+A',
          action: () => editorStore.executeAction('editor.action.blockComment'),
        },
      ],
    },
    {
      name: 'Selection',
      items: [
        {
          label: 'Select All',
          shortcut: mac ? '⌘A' : 'Ctrl+A',
          action: () => editorStore.executeAction('editor.action.selectAll'),
        },
        { separator: true },
        {
          label: 'Copy Line Up',
          shortcut: mac ? '⇧⌥↑' : 'Shift+Alt+↑',
          action: () => editorStore.executeAction('editor.action.copyLinesUpAction'),
        },
        {
          label: 'Copy Line Down',
          shortcut: mac ? '⇧⌥↓' : 'Shift+Alt+↓',
          action: () => editorStore.executeAction('editor.action.copyLinesDownAction'),
        },
        {
          label: 'Move Line Up',
          shortcut: mac ? '⌥↑' : 'Alt+↑',
          action: () => editorStore.executeAction('editor.action.moveLinesUpAction'),
        },
        {
          label: 'Move Line Down',
          shortcut: mac ? '⌥↓' : 'Alt+↓',
          action: () => editorStore.executeAction('editor.action.moveLinesDownAction'),
        },
        {
          label: 'Duplicate Selection',
          shortcut: mac ? '⌘D' : 'Ctrl+D',
          action: () => editorStore.duplicateSelection(),
        },
        { separator: true },
        {
          label: 'Add Cursor Above',
          shortcut: mac ? '⌥⌘↑' : 'Alt+Ctrl+↑',
          action: () => editorStore.executeAction('editor.action.insertCursorAbove'),
        },
        {
          label: 'Add Cursor Below',
          shortcut: mac ? '⌥⌘↓' : 'Alt+Ctrl+↓',
          action: () => editorStore.executeAction('editor.action.insertCursorBelow'),
        },
        {
          label: 'Select All Occurrences',
          shortcut: mac ? '⇧⌘L' : 'Ctrl+Shift+L',
          action: () => editorStore.executeAction('editor.action.selectHighlights'),
        },
      ],
    },
    {
      name: 'View',
      items: [
        {
          label: 'Toggle Side Bar',
          shortcut: mac ? '⌘B' : 'Ctrl+B',
          action: () => emit('toggle-sidebar'),
        },
        {
          label: 'Toggle Search',
          shortcut: mac ? '⇧⌘F' : 'Ctrl+Shift+F',
          action: () => emit('toggle-search'),
        },
        { separator: true },
        {
          label: 'Toggle Console',
          shortcut: mac ? '⌘J' : 'Ctrl+J',
          action: () => emit('toggle-console'),
        },
        {
          label: 'Toggle Terminal',
          shortcut: mac ? '⌃`' : 'Ctrl+`',
          action: () => emit('toggle-console'),
        },
      ],
    },
    {
      name: 'Go',
      items: [
        {
          label: 'Go to Line/Column...',
          shortcut: mac ? '⌃G' : 'Ctrl+G',
          action: () => editorStore.promptGoToLine(),
        },
        {
          label: 'Go to Bracket',
          shortcut: mac ? '⇧⌘\\' : 'Ctrl+Shift+\\',
          action: () => editorStore.executeAction('editor.action.jumpToBracket'),
        },
        {
          label: 'Go to Definition',
          shortcut: 'F12',
          action: () => editorStore.executeAction('editor.action.revealDefinition'),
        },
      ],
    },
    {
      name: 'Run',
      items: [
        {
          label: 'Run (Run on console)',
          shortcut: mac ? '⌃F5' : 'Ctrl+F5',
          action: () => emit('run', 'js'),
        },
        {
          label: 'Run with preview',
          shortcut: 'F5',
          action: () => emit('run', 'html'),
        },
      ],
    },
  ]
})
</script>

<style scoped>
.app-titlebar {
  height: 35px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  user-select: none;
  font-size: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-badge {
  background: #f7df1e;
  color: #000000;
  font-weight: 800;
  font-size: 11px;
  padding: 2px 5px;
  border-radius: 3px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.titlebar-menu {
  display: flex;
  align-items: center;
  gap: 2px;
}

.menu-item-wrapper {
  position: relative;
}

.menu-trigger {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  transition:
    color 0.12s,
    background 0.12s;
}

.menu-trigger:hover,
.menu-trigger.active {
  color: var(--text-bright);
  background: var(--bg-selected);
}

.menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 230px;
  background: var(--bg-secondary);
  border: 1px solid #454545;
  border-radius: 6px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.65),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  padding: 4px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.menu-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px 10px;
  font-size: 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
  transition:
    background 0.1s,
    color 0.1s;
}

.menu-action:hover {
  background: var(--accent-blue);
  color: #ffffff;
}

.action-label {
  flex: 1;
  white-space: nowrap;
}

.action-shortcut {
  margin-left: 20px;
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.menu-action:hover .action-shortcut {
  color: rgba(255, 255, 255, 0.85);
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 6px;
}

.titlebar-center {
  flex: 1;
  max-width: 500px;
  display: flex;
  justify-content: center;
}

.command-palette-pill {
  width: 100%;
  max-width: 440px;
  height: 24px;
  background: #1e1e1e;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.command-palette-pill:hover {
  border-color: #555555;
  color: var(--text-primary);
}

.palette-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shortcut-badge {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 9px;
  color: #aaa;
  font-family: var(--font-mono);
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.titlebar-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}

.titlebar-btn:hover {
  background: var(--bg-selected);
  color: var(--text-bright);
}

.titlebar-btn.active {
  background: var(--bg-selected);
  color: var(--accent-blue);
}
</style>
