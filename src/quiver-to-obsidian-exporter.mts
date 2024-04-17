import fg from 'fast-glob'
import fs from 'fs-extra'
import pathModule from 'path'
import * as cliProgress from 'cli-progress'
import chalk from 'chalk'

import { getLogger } from './logger.mjs';
import './extensions/String+Path.mjs';
import { transformQuiverNoteToObsidian } from './quiver-to-obsidian-transform.mjs'
import { cloneTimestamp } from './migration-support/file-timestamp-cloner.mjs';
import { AttachmentFolderPolicy, calculateAttachmentFolderPath } from './migration-support/attachment-folder-treatment.mjs'


const logger = getLogger();

const progressBar = new cliProgress.SingleBar({
  format: `${chalk.green('{bar}')} | ${chalk.hex('#00BFFF')('{percentage}%')} || ${chalk.yellow('{value}/{total}')} Notebooks || Duration: ${chalk.cyan('{duration_formatted}')}`,
  barCompleteChar: '\u2588',   // completely filled rectangle
  barIncompleteChar: '\u2591', // thin rectangle
  hideCursor: true
}, cliProgress.Presets.shades_classic);

const Keys = {
  children: 'children',
} as const;


export function exportQvlibrary(qvlibrary: string, outputPath: string, attachmentFolderPolicy: AttachmentFolderPolicy) {

  const glob = pathModule.join(qvlibrary, '*.qvnotebook')
  const quiverNoteBooks = fg.sync(glob, { onlyDirectories: true })

  logger.forceInfo('==> retrieving the qvnotebooks info under the qvlibrary.');
  const notebookPathsByUUID = quiverNoteBooks.reduce((acc: Map<string, string>, path: string): Map<string, string> => {
    const fileName = path.lastPathComponent();
    const uuid = fileName.split('.')[0];
    return acc.set(uuid, path);
  }, new Map<string, string>());

  logger.debugNotebookPathsByUUID(notebookPathsByUUID)

  logger.forceInfo(`==> processing the default fixed notebooks 'Inbox' and 'Trash' in Quiver.`);
  ['Inbox', 'Trash'].forEach((fixedName: string) => {
    const notebookPath = notebookPathsByUUID.get(fixedName);
    convertNotebook(notebookPath, outputPath, [fixedName], attachmentFolderPolicy);
  });

  logger.forceInfo('==> retrieving the root meta.json, which stores the tree structure.');
  const treeMetaPath = pathModule.join(qvlibrary, 'meta.json');
  const treeMetaText = fs.readFileSync(treeMetaPath, 'utf8').toString();
  const treeMeta = JSON.parse(treeMetaText);

  const totalFileCount = totalNumberOfFile(treeMeta, notebookPathsByUUID);
  logger.info(`totalFileCount=${totalFileCount}`);

  logger.forceInfo('==> traversing the folder tree structure to convert Quiver notebooks into Obsidian .md files.');
  progressBar.start(totalFileCount, 0);
  const rootChildren = treeMeta[Keys.children];
  traverseFolderTree(rootChildren, 0, [], outputPath, notebookPathsByUUID, attachmentFolderPolicy);

  logger.info('==> Traversal of the folder tree structure has been completed.');
  progressBar.stop();
  logger.completed();
}

function totalNumberOfFile(treeMeta: any, notebooksByUUID: Map<string, string>): number {

  const rootChildren = treeMeta[Keys.children];

  return traverse(rootChildren, notebooksByUUID, 0);

  function traverse(children: [], notebooksByUUID: Map<string, string>, fileCount: number): number {

    if (children === undefined) { return fileCount; }

    children.forEach((node) => {

      const uuid = node['uuid'];
  
      const notebookPath = notebooksByUUID.get(uuid);
      if (notebookPath === undefined) {
        return;
      }

      fileCount++;
      const notebookMeta = JSON.parse(fs.readFileSync(pathModule.join(notebookPath, 'meta.json'), 'utf8'));
      fileCount = traverse(node[Keys.children], notebooksByUUID, fileCount);
    })
  
    return fileCount;
  }
}

function traverseFolderTree(children: [], depth: number, pathStack: string[], outputPath: string, notebooksByUUID: Map<string, string>, attachmentFolderPolicy: AttachmentFolderPolicy) {

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
    progressBar.increment();
    convertNotebook(notebookPath, outputPath, pathStack, attachmentFolderPolicy);
    traverseFolderTree(node[Keys.children], depth + 1, pathStack, outputPath, notebooksByUUID, attachmentFolderPolicy);
    pathStack.pop();
  })
}

export function convertNotebook(quiverNotebook: string, outputPath: string, pathStack: string[], attachmentFolderPolicy: AttachmentFolderPolicy) {

  const glob = pathModule.join(quiverNotebook, '*.qvnote')
  const quiverNotePaths = fg.sync(glob, { onlyDirectories: true })

  const obsidianNoteDirPath = pathModule.join(outputPath, ...pathStack)
  const obsidianAttachmentFolderPath = calculateAttachmentFolderPath(outputPath, obsidianNoteDirPath, attachmentFolderPolicy)

  for (const quiverNotePath of quiverNotePaths) {
    const { title, content, quiverMeta } = transformQuiverNoteToObsidian(quiverNotePath)
    outputNoteAndCopyResources({ quiverNotePath, quiverMeta }, { obsidianNoteDirPath, title, content, obsidianAttachmentFolderPath })
  }
}

function outputNoteAndCopyResources(srcInfo: any, destInfo: any) {

  const { quiverNotePath, quiverMeta } = srcInfo
  const { obsidianNoteDirPath, title, content, obsidianAttachmentFolderPath } = destInfo

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

  cloneTimestamp(destFilePath, quiverMeta);
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

