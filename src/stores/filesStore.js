import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { DEFAULT_FILES_MAP, DEFAULT_FILE_CONTENT_MAP } from '@/constants/initialFiles'
import { getFileFullPath } from '@/utils/pathUtils'

/**
 * Store managing the virtual file system, directory tree,
 * file content maps, and file persistence via localStorage.
 */
export const useFilesStore = defineStore('filesStore', () => {
  // Flat list of files and folders stored in localStorage
  const filesMap = useStorage('editor_files_map', DEFAULT_FILES_MAP)

  // File contents keyed by unique file id
  const fileContentMap = useStorage('editor_file_content_map', DEFAULT_FILE_CONTENT_MAP)

  /**
   * Resolves the full relative workspace path of a given file or folder id
   * @param {string} fileId
   * @returns {string}
   */
  const getFilePath = (fileId) => {
    return getFileFullPath(fileId, filesMap.value)
  }

  /**
   * Adds a file or folder node to the tree
   * @param {{ id: string, name: string, type: 'file'|'folder', parentId: string|null, isOpen?: boolean }} file
   */
  const addFile = (file) => {
    filesMap.value.push(file)
  }

  /**
   * Saves or updates content for a given file id
   * @param {string} fileId
   * @param {{ id: string, name: string, language: string, content: string }} content
   */
  const addFileContent = (fileId, content) => {
    fileContentMap.value[fileId] = content
  }

  /**
   * Renames a file or folder and updates descendant relations
   * @param {string} oldId
   * @param {string} newName
   */
  const renameFile = (oldId, newName) => {
    const item = filesMap.value.find((f) => f.id === oldId)
    if (!item) return
    const newId = newName
    item.name = newName
    item.id = newId

    // If item was a folder, update children parent references
    filesMap.value.forEach((child) => {
      if (child.parentId === oldId) {
        child.parentId = newId
      }
    })

    // Update content map key
    if (fileContentMap.value[oldId]) {
      const existing = fileContentMap.value[oldId]
      delete fileContentMap.value[oldId]
      fileContentMap.value[newId] = {
        ...existing,
        id: newId,
        name: newName,
      }
    }
  }

  /**
   * Recursively deletes a file or directory and associated content
   * @param {string} id
   */
  const deleteFile = (id) => {
    const toDelete = new Set([id])
    let foundMore = true
    while (foundMore) {
      foundMore = false
      filesMap.value.forEach((f) => {
        if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id)
          foundMore = true
        }
      })
    }

    filesMap.value = filesMap.value.filter((f) => !toDelete.has(f.id))
    toDelete.forEach((delId) => {
      if (fileContentMap.value[delId]) {
        delete fileContentMap.value[delId]
      }
    })
  }

  /*
   * NEXT PHASE:
   * 1. Project ZIP Export / Download: Package filesMap & fileContentMap into a .zip using JSZip.
   * 2. Project Import: Drag & drop folders or ZIP files into the explorer to unpack.
   * 3. Workspace templates: Switch between Vue 3, React, Vanilla JS, and Markdown starter templates.
   * 4. File duplicate & move operations: Drag & drop files between folders.
   */

  return {
    filesMap,
    fileContentMap,
    getFilePath,
    addFile,
    addFileContent,
    renameFile,
    deleteFile,
  }
})
