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
  const notes = fg.sync(glob, { onlyDirectories: true })

  const notebookOutputPath = path.join(outputPath, notebookMeta.name)
  const notebookResourcePath = path.join(notebookOutputPath, `./_resources`)

  for (const note of notes) {
    const { title, content } = transformQuiverNoteToObsidian(note)
    outputNoteAndCopyResources(notebookOutputPath, title, content, note, notebookResourcePath)
  }
}

function outputNoteAndCopyResources(notebookOutputPath: string, title: string, content: string, note: string, notebookResourcePath: string) {

  fs.ensureDirSync(notebookOutputPath)
  fs.ensureDirSync(notebookResourcePath)
  
  const fileName = path.join(notebookOutputPath, `${title}.md`)

  try {
    fs.writeFileSync(fileName, content)

    const notebookResourceDir = path.join(note, 'resources')

    if (fs.pathExistsSync(notebookResourceDir)) {
      // copy every file under resources to notebook resource dir
      const files = fg.sync(path.join(notebookResourceDir, '**/*'))
      for (const file of files) {
        const fileName = path.basename(file)
        const dest = path.join(notebookResourcePath, fileName)
        fs.copySync(file, dest)
      }
    }
  }
  catch (e) {
    console.error(e)
    console.error(`Invalid file name ${fileName}`)
  }
}
