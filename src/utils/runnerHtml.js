import iframeScript from '@/constants/iframeScript'
import { createImportMapScript } from './importMapUtils.js'

/**
 * Builds an isolated HTML document string for executing JavaScript virtual files
 * as native ES modules in a sandboxed iframe with console interception and import maps.
 *
 * @param {string} code - JavaScript source code to execute
 * @param {Record<string, { id?: string, name?: string, path?: string, content?: string }>} [fileContentMap] - Virtual workspace files
 * @param {Array<{ id: string, name: string, parentId?: string|null }>} [filesMap] - Virtual file tree nodes
 * @returns {string} - Complete HTML document string for iframe srcdoc
 */
export const buildRunnerHtml = (code = '', fileContentMap = {}, filesMap = []) => {
  const importMapTag = createImportMapScript(fileContentMap, filesMap)
  const safeCode = (code || '').replace(/<\/script>/gi, '<\\/script>')

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script>${iframeScript}</script>
    ${importMapTag}
  </head>
  <body>
    <script type="module">
${safeCode}
    </script>
  </body>
</html>`
}

export const getRunnerHtml = buildRunnerHtml

export default buildRunnerHtml
