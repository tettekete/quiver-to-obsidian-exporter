import fs from "fs-extra";
import path from "path";

import TurndownService from "./transform/turndown-service.mjs";
import { formatTime } from './transform/formatter.mjs';
import { transformImageLinkOnMarkdown } from './transform/image-link-transform.mjs';


export function transformQuiverNoteToObsidian(note: string): { title: string; content: string}  {

  const meta = JSON.parse(fs.readFileSync(path.join(note, 'meta.json'), 'utf8'))
  const content = JSON.parse(fs.readFileSync(path.join(note, 'content.json'), 'utf8'))

  const tags = meta.tags.length > 0 ? meta.tags.map(t => `#${t}`).join(' ') + '\n\n' : ''

  const cellsToMarkdown = content.cells.map(cell => {
    switch (cell.type) {
      case 'text':
        return TurndownService.turndown(cell.data)
      case 'code':
        return `\`\`\`${cell.language}\n${cell.data}\n\`\`\``
      case 'markdown':
        return transformImageLinkOnMarkdown(cell.data)
      case 'diagram':
        return `\`\`\`${cell.diagramType}\n${cell.data}\n\`\`\``
      case 'latex':
        return `$$\n${cell.data}\n$$`
      default:
        throw new Error(`Unknown cell type: ${cell.type}`)
    }
  }).join('\n\n')

  return {
    title: meta.title,
    content: `${tags}${cellsToMarkdown}

    Created At: ${formatTime(meta.created_at * 1000)}
    Updated At: ${formatTime(meta.updated_at * 1000)}
  `
  }
}
