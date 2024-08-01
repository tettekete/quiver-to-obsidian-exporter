import fs from "fs-extra";
import pathModule from "path";

import TurndownService from "./transform/turndown-service.mjs";
import { formatTimestamp } from './transform/formatter.mjs';
import { transformImageLinkOnMarkdown } from './transform/image-link-transform.mjs';
import { sanitizeTitle } from './transform/title-sanitizer.mjs'


export function transformQuiverNoteToObsidian(quiverNotePath: string): { title: string; content: string; quiverMeta: any; }  {

  const quiverMeta = JSON.parse(fs.readFileSync(pathModule.join(quiverNotePath, 'meta.json'), 'utf8'))
  const quiverContent = JSON.parse(fs.readFileSync(pathModule.join(quiverNotePath, 'content.json'), 'utf8'))

  const transformedContent = quiverContent.cells.map(cell => {
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
        return `${cell.data}`
      default:
        throw new Error(`Unknown cell type: ${cell.type}`)
    }
  }).join('\n\n')

  return {
    title: sanitizeTitle(quiverMeta.title),
    content: makeObsidianContent(quiverMeta, transformedContent),
    quiverMeta: quiverMeta,
  }
}

function makeObsidianContent(quiverMeta: any, transformedContent: any): string {

  const tags = quiverMeta.tags.length > 0 ? quiverMeta.tags.map((tag: string) => `  - ${tag}`).join('\n') : '';

  return `${makeYamlFrontMatter(tags, quiverMeta)}

${transformedContent}
`;
}

function makeYamlFrontMatter(tags: string, quiverMeta: any): string {

  let _title = quiverMeta.title;
  _title.replaceAll(/'/g,"''"); // escape single quotes for YAML value

  return `---
title: '${_title}'
tags:
${tags}
origin: Quiver
created-at: ${formatTimestamp(quiverMeta.created_at * 1000)}
updated-at: ${formatTimestamp(quiverMeta.updated_at * 1000)}
---
`;
}
