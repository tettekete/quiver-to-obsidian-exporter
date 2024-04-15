import fg from 'fast-glob'
import fs from 'fs-extra'
import path from 'path'

import { transformQuiverNoteToObsidian } from './quiver-to-obsidian-transform.mjs'


export function exportQvlibrary(qvlibrary: string, outputPath: string) {

  const glob = path.join(qvlibrary, '*.qvnotebook')
  const noteBooks = fg.sync(glob, { onlyDirectories: true })


  for (const notebook of noteBooks) {
    convertNotebook(notebook, outputPath)
  }
}


export function convertNotebook (notebook: string, outputPath: string) {

  const notebookMeta = JSON.parse(fs.readFileSync(path.join(notebook, 'meta.json'), 'utf8'))

  const glob = path.join(notebook, '*.qvnote')
  const quiverNotePaths = fg.sync(glob, { onlyDirectories: true })

  const obsidianNoteDirPath = path.join(outputPath, notebookMeta.name)
  const obsidianAttachmentFolderPath = path.join(obsidianNoteDirPath, `./_resources`)

  for (const quiverNotePath of quiverNotePaths) {
    const { title, content } = transformQuiverNoteToObsidian(quiverNotePath)
    outputNoteAndCopyResources(obsidianNoteDirPath, title, content, quiverNotePath, obsidianAttachmentFolderPath)
  }
}

function outputNoteAndCopyResources(obsidianNoteDirPath: string, title: string, content: string, quiverNotePath: string, obsidianAttachmentFolderPath: string) {

  fs.ensureDirSync(obsidianNoteDirPath)
  fs.ensureDirSync(obsidianAttachmentFolderPath)
  
  const destFilePath = path.join(obsidianNoteDirPath, `${title}.md`)

  try {
    fs.writeFileSync(destFilePath, content)
    copyResources(quiverNotePath, obsidianAttachmentFolderPath)
  }
  catch (e) {
    console.error(e)
    console.error(`Invalid file name ${destFilePath}`)
  }
}

function copyResources(quiverNotePath: string, obsidianAttachmentFolderPath: string) {

  const notebookResourceDir = path.join(quiverNotePath, 'resources')

  if (!fs.pathExistsSync(notebookResourceDir)) {
    return
  }

  // copy every file under resources to notebook resource dir
  const files = fg.sync(path.join(notebookResourceDir, '**/*'))

  for (const file of files) {
    const fileName = path.basename(file)
    const dest = path.join(obsidianAttachmentFolderPath, fileName)
    fs.copySync(file, dest)
  }
}

