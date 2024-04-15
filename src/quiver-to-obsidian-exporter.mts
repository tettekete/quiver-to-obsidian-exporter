import fg from 'fast-glob'
import fs from 'fs-extra'
import pathModule from 'path'

import './extensions/String+Path.mjs';
import { transformQuiverNoteToObsidian } from './quiver-to-obsidian-transform.mjs'
import { LogConfig, createLogger } from './logger.mjs'


const Keys = {
  children: 'children',
} as const;


let logger;


export function exportQvlibrary(qvlibrary: string, outputPath: string, logConfig: LogConfig) {
  
  logger = createLogger(logConfig);

  const glob = pathModule.join(qvlibrary, '*.qvnotebook')
  const quiverNoteBooks = fg.sync(glob, { onlyDirectories: true })

  logger.info('==> retrieving the qvnotebooks info under the qvlibrary.');
  const notebookPathsByUUID = quiverNoteBooks.reduce((acc: Map<string, string>, path: string): Map<string, string> => {
    const fileName = path.lastPathComponent();
    const uuid = fileName.split('.')[0];
    return acc.set(uuid, path);
  }, new Map<string, string>());

  logger.debugNotebookPathsByUUID(notebookPathsByUUID)

  logger.info(`==> processing the default fixed notebooks 'Inbox' and 'Trash' in Quiver.`);
  ['Inbox', 'Trash'].forEach((fixedName: string) => {
    const notebookPath = notebookPathsByUUID.get(fixedName);
    convertNotebook(notebookPath, outputPath, [fixedName]);
  });

  logger.info('==> retrieving the root meta.json, which stores the tree structure.');
  const treeMetaPath = pathModule.join(qvlibrary, 'meta.json');
  const treeMetaText = fs.readFileSync(treeMetaPath, 'utf8').toString();
  const treeMeta = JSON.parse(treeMetaText);

  logger.info('==> traverse the folder tree structure to convert Quiver notebooks into Obsidian .md files.');
  const rootChildren = treeMeta[Keys.children];
  traverseFolderTree(rootChildren, 0, [], outputPath, notebookPathsByUUID);

  logger.info('==> Traversal of the folder tree structure has been completed.');
  logger.completed()
}

function traverseFolderTree(children: [], depth: number, pathStack: string[], outputPath: string, notebooksByUUID: Map<string, string>) {

  logger.debug(" ".repeat(depth * 4) + 'traverseFolderTree called...');
  if (children === undefined) { return; }

  children.forEach((node) => {

    const uuid = node['uuid'];
    logger.info(" ".repeat(depth * 4) + uuid);

    const notebookPath = notebooksByUUID.get(uuid);
    if (notebookPath === undefined) {
      return;
    }

    logger.debug('==> retrieving the qvnotebook meta.json.');
    const notebookMeta = JSON.parse(fs.readFileSync(pathModule.join(notebookPath, 'meta.json'), 'utf8'));

    pathStack.push(notebookMeta.name);
    convertNotebook(notebookPath, outputPath, pathStack);
    traverseFolderTree(node[Keys.children], depth + 1, pathStack, outputPath, notebooksByUUID);
    pathStack.pop();
  })
}

export function convertNotebook(quiverNotebook: string, outputPath: string, pathStack: string[]) {

  const notebookMeta = JSON.parse(fs.readFileSync(pathModule.join(quiverNotebook, 'meta.json'), 'utf8'))

  const glob = pathModule.join(quiverNotebook, '*.qvnote')
  const quiverNotePaths = fg.sync(glob, { onlyDirectories: true })

  const obsidianNoteDirPath = pathModule.join(outputPath, ...pathStack)
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

