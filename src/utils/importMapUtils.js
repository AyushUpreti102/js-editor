/**
 * Utility for generating native browser Import Maps from the virtual workspace files.
 * This maps relative and bare import specifiers (e.g., './math.js', './math', 'math.js')
 * to self-contained data: URLs, enabling native ES module imports and exports.
 */

import { getFileFullPath } from './pathUtils.js'

/**
 * Generates an Import Map object mapping virtual files to data: URLs
 *
 * @param {Record<string, { id?: string, name?: string, path?: string, content?: string }>} fileContentMap
 * @param {Array<{ id: string, name: string, parentId?: string|null }>} [filesMap]
 * @returns {{ imports: Record<string, string> }}
 */
export const generateImportMap = (fileContentMap = {}, filesMap = []) => {
  const imports = {}

  Object.entries(fileContentMap).forEach(([key, item]) => {
    // Determine the full relative path within the workspace
    let filePath = ''
    if (filesMap && Array.isArray(filesMap) && filesMap.length > 0) {
      const targetId = item?.id || key
      const treeNode = filesMap.find((f) => f.id === targetId || f.name === targetId)
      if (treeNode) {
        filePath = getFileFullPath(treeNode, filesMap)
      }
    }

    if (!filePath) {
      filePath = item?.path || item?.name || key
    }

    if (!filePath) return

    // Only process JavaScript and TypeScript virtual files
    if (/\.(js|mjs|ts)$/i.test(filePath)) {
      const content = typeof item === 'string' ? item : (item?.content ?? '')
      const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(content)}`

      const cleanPath = filePath.replace(/^\.?\//, '')
      const withoutExt = cleanPath.replace(/\.(js|mjs|ts)$/i, '')

      // Register standard relative, root-relative, and bare specifiers with directory structure
      imports[`./${cleanPath}`] = dataUrl
      imports[`./${withoutExt}`] = dataUrl
      imports[`/${cleanPath}`] = dataUrl
      imports[`/${withoutExt}`] = dataUrl
      imports[cleanPath] = dataUrl
      imports[withoutExt] = dataUrl
    }
  })

  return { imports }
}

/**
 * Generates a <script type="importmap"> HTML element string from the virtual workspace files
 *
 * @param {Record<string, { id?: string, name?: string, path?: string, content?: string }>} fileContentMap
 * @param {Array<{ id: string, name: string, parentId?: string|null }>} [filesMap]
 * @returns {string} - HTML script tag or empty string if no modules present
 */
export const createImportMapScript = (fileContentMap = {}, filesMap = []) => {
  const importMap = generateImportMap(fileContentMap, filesMap)
  if (Object.keys(importMap.imports).length === 0) {
    return ''
  }
  return `<script type="importmap">\n${JSON.stringify(importMap, null, 2)}\n</script>`
}

export default {
  generateImportMap,
  createImportMapScript,
}
