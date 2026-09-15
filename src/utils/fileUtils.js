import iframeScript from '@/constants/iframeScript'
import { createImportMapScript } from './importMapUtils.js'
import { getFileFullPath } from './pathUtils.js'

/**
 * Determines Monaco editor language identifier based on filename extension
 * @param {string} name - File name
 * @returns {string} - Language identifier for Monaco Editor
 */
export const getLanguageFromName = (name) => {
  if (!name) return 'plaintext'
  const lower = name.toLowerCase()
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'javascript'
  if (lower.endsWith('.ts')) return 'typescript'
  if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) return 'css'
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
  if (lower.endsWith('.vue')) return 'html'
  return 'plaintext'
}

/**
 * Extracts lowercase file extension from filename without the dot
 * @param {string} filename
 * @returns {string}
 */
export const getFileExt = (filename) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

/**
 * Builds an executable HTML document from the virtual workspace files:
 * 1. Inlines referenced CSS and all workspace stylesheets.
 * 2. Inlines referenced JS and workspace scripts (promoting to ES modules if import/export present).
 * 3. Injects browser Import Maps for virtual files so relative/bare module imports resolve.
 * 4. Injects the console interceptor script to route logs to the IDE console panel.
 *
 * @param {string} rawHtml - Source HTML content (e.g. from index.html)
 * @param {Record<string, { id?: string, name?: string, path?: string, content?: string }>} fileContentMap - Workspace files map
 * @param {Array<{ id: string, name: string, parentId?: string|null }>} [filesMap] - Virtual file tree nodes
 * @returns {string} - Complete, runnable HTML string for iframe srcdoc
 */
export const buildExecutableHtml = (rawHtml, fileContentMap = {}, filesMap = []) => {
  let html =
    rawHtml ||
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>JS Editor Preview</title>
  </head>
  <body>
    <div style="font-family: system-ui, sans-serif; padding: 24px; color: #cbd5e1; background: #0f172a; min-height: 100vh;">
      <h2>No index.html found</h2>
      <p>Create an index.html file in the Explorer to see the live preview.</p>
    </div>
  </body>
</html>`

  // Helper to find file content by relative/absolute path
  const findFileContent = (path) => {
    if (!path) return null
    const cleanPath = path.replace(/^\.?\//, '')
    const targetKey = Object.keys(fileContentMap).find((k) => {
      const item = fileContentMap[k]
      const name = item?.name || k
      let fullPath = item?.path || ''
      if (!fullPath && filesMap && Array.isArray(filesMap) && filesMap.length > 0) {
        const node = filesMap.find((f) => f.id === (item?.id || k) || f.id === k)
        if (node) fullPath = getFileFullPath(node, filesMap)
      }
      return (
        (fullPath && fullPath.toLowerCase() === cleanPath.toLowerCase()) ||
        name.toLowerCase() === cleanPath.toLowerCase() ||
        name.toLowerCase() === path.toLowerCase() ||
        k.toLowerCase() === cleanPath.toLowerCase() ||
        cleanPath.toLowerCase().endsWith(name.toLowerCase())
      )
    })
    if (!targetKey) return null
    const val = fileContentMap[targetKey]
    return typeof val === 'string' ? val : (val?.content ?? '')
  }

  // 1. Inlining linked local stylesheets <link rel="stylesheet" href="...">
  html = html.replace(
    /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>|<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi,
    (match, href1, href2) => {
      const href = href1 || href2
      const cssContent = findFileContent(href)
      if (cssContent !== null) {
        return `<style>\n/* Inlined from ${href} */\n${cssContent}\n</style>`
      }
      if (!/^https?:\/\//i.test(href)) {
        return `<!-- Stylesheet ${href} not found in workspace -->`
      }
      return match
    },
  )

  // 2. Inlining linked local scripts <script ... src="...">
  html = html.replace(
    /<script\s+([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi,
    (match, before, src, after) => {
      const jsContent = findFileContent(src)
      if (jsContent !== null) {
        const combinedAttrs = `${before} ${after}`.trim()
        const hasModuleType = /type=["']module["']/i.test(combinedAttrs)
        const hasModuleSyntax = /\b(import\s+|export\s+|import\s*\(|export\s*\{|export\s*\*)/.test(
          jsContent,
        )
        const typeAttr = !hasModuleType && hasModuleSyntax ? ' type="module"' : ''
        const cleanAttrs = combinedAttrs ? ` ${combinedAttrs}` : ''
        return `<script${cleanAttrs}${typeAttr}>\n// Inlined from ${src}\n${jsContent}\n</script>`
      }
      // If local reference not found in workspace, block requesting host dev server
      if (!/^https?:\/\//i.test(src)) {
        return `<!-- Script ${src} not found in workspace -->`
      }
      return match
    },
  )

  // 3. Inject console interceptor script and import map
  const importMapTag = createImportMapScript(fileContentMap, filesMap)
  const headInjections = [
    iframeScript ? `<script>\n${iframeScript}\n</script>` : '',
    importMapTag,
  ]
    .filter(Boolean)
    .join('\n')

  if (headInjections) {
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>\n${headInjections}`)
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html>\n<head>${headInjections}</head>`)
    } else {
      html = `${headInjections}\n${html}`
    }
  }

  return html
}

export { getFileFullPath } from './pathUtils.js'
export { buildRunnerHtml, getRunnerHtml } from './runnerHtml.js'

