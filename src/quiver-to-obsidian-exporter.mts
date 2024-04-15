import fg from 'fast-glob'
import fs from 'fs-extra'
import pathModule from 'path'

import './extensions/String+Path.mjs';
import { transformQuiverNoteToObsidian } from './quiver-to-obsidian-transform.mjs'
import { LogConfig, createLogger } from './logger.mjs'


export function exportQvlibrary(qvlibrary: string, outputPath: string, logConfig: LogConfig) {
  
  const logger = createLogger(logConfig);

  const glob = pathModule.join(qvlibrary, '*.qvnotebook')
  const quiverNoteBooks = fg.sync(glob, { onlyDirectories: true })

  const notebookPathsByUUID = quiverNoteBooks.reduce((acc: Map<string, string>, path: string): Map<string, string> => {
    const fileName = path.lastPathComponent();
    const uuid = fileName.split('.')[0];
    return acc.set(uuid, path);
  }, new Map<string, string>());

  logger.debugNotebookPathsByUUID(notebookPathsByUUID)

  for (const quiverNotebook of quiverNoteBooks) {
    convertNotebook(quiverNotebook, outputPath)
  }
}


export function convertNotebook(quiverNotebook: string, outputPath: string) {

  const notebookMeta = JSON.parse(fs.readFileSync(pathModule.join(quiverNotebook, 'meta.json'), 'utf8'))

  const glob = pathModule.join(quiverNotebook, '*.qvnote')
  const quiverNotePaths = fg.sync(glob, { onlyDirectories: true })

  const obsidianNoteDirPath = pathModule.join(outputPath, notebookMeta.name)
  const obsidianAttachmentFolderPath = pathModule.join(obsidianNoteDirPath, `./_resources`)

  for (const quiverNotePath of quiverNotePaths) {
    const { title, content } = transformQuiverNoteToObsidian(quiverNotePath)
    outputNoteAndCopyResources(quiverNotePath, obsidianNoteDirPath, title, content, obsidianAttachmentFolderPath)
  }
}

function outputNoteAndCopyResources(quiverNotePath: string, obsidianNoteDirPath: string, title: string, content: string, obsidianAttachmentFolderPath: string) {

  fs.ensureDirSync(obsidianNoteDirPath)
  fs.ensureDirSync(obsidianAttachmentFolderPath)
  
  const destFilePath = pathModule.join(obsidianNoteDirPath, `${title}.md`)

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

  const notebookResourceDir = pathModule.join(quiverNotePath, 'resources')

  if (!fs.pathExistsSync(notebookResourceDir)) {
    return
  }

  // copy every file under resources to notebook resource dir
  const files = fg.sync(pathModule.join(notebookResourceDir, '**/*'))

  for (const file of files) {
    const fileName = pathModule.basename(file)
    const dest = pathModule.join(obsidianAttachmentFolderPath, fileName)
    fs.copySync(file, dest)
  }
}

