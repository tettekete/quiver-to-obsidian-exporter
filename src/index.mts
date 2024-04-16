#!/usr/bin/env node
import meow from 'meow';

import { getLogger } from './logger.mjs';
import { assertValidQvlibraryPath } from './assertions.mjs';
import { exportQvlibrary } from './quiver-to-obsidian-exporter.mjs';
import { AttachmentFolderPolicy, createAttachmentFolderPolicyWithSubfolder, createAttachmentFolderPolicyWithoutSubfolder } from './migration-support/attachment-folder-treatment.mjs';


const logger = getLogger();


const helpText = `
Usage
  $ qvr2obs <input.qvlibrary> -o <output folder>  -a <Attachment folder policy>
  or
  $ qvr2obs <input.qvlibrary> -o <output folder>  -a <Attachment folder policy> -n <Attachment subfolder name if needed>

Options
  --output, -o: Output folder
  --attachmentFolderPolicy, -a: Attachment folder policy (vaultFolder, subfolderUnderVault, sameFolderAsEachFile, subfolderUnderEachFolder). 'subfolderUnderVault' and 'subfolderUnderEachFolder' require subfolder name.
  --attachmentSubfolderName, -n: Specify the subfolder name if 'subfolderUnderVault' or 'subfolderUnderEachFolder' is selected as the attachmentFolderPolicy option.

Examples
  $ qvr2obs MyNote.qvlibrary -o dest/MyNote -a vaultFolder
  $ qvr2obs MyNote.qvlibrary -o dest/MyNote -a subfolderUnderVault -n _attachment
`


const args = process.argv.slice(2)
if (args.length === 0) {
    meow(helpText, { importMeta: import.meta }).showHelp();
}

const cli = meow(helpText, {
  importMeta: import.meta,
  flags: {
    output: {
      type: 'string',
      shortFlag: 'o',
      isRequired: true,
    },
    attachmentFolderPolicy: {
      type: 'string',
      choices: ['vaultFolder', 'subfolderUnderVault', 'sameFolderAsEachFile', 'subfolderUnderEachFolder'],
      shortFlag: 'a',
      isRequired: true,
    },
    attachmentSubfolderName: {
      type: 'string',
      shortFlag: 'n',
      isRequired: (flags, input) => {
        return (flags.attachmentFolderPolicy as string)?.startsWith('subfolder');
      },
    },
  },
});

if (cli.input.length < 1) {
  logger.error('Please provide a qvlibrary file');
  cli.showHelp();
}

if (!cli.flags.output) {
  logger.error('Please provide an output folder');
  cli.showHelp();
}

if (cli.flags.attachmentFolderPolicy.startsWith('subfolder')) {
  if (!cli.flags.attachmentSubfolderName) {
    logger.error(`Please provide an Attachment subfolder name with -n option (Because you specified '${cli.flags.attachmentFolderPolicy}' with -i)`);
      cli.showHelp();
  }
}
else {
  if (cli.flags.attachmentSubfolderName) {
    logger.error(`It is not necessary to specify Attachment subfolder name (Because you specified '${cli.flags.attachmentFolderPolicy}' with -i) (or is it a mistake in specifying attachmentFolderPolicy?)`);
      cli.showHelp();
  }
}



const qvlibraryPath = cli.input[0]
assertValidQvlibraryPath(qvlibraryPath);

const outputPath = cli.flags.output

const attachmentFolderPolicy = createAttachmentFolderPolicy(cli.flags.attachmentFolderPolicy, cli.flags.attachmentSubfolderName)
logger.info(`AttachmentFolderPolicy: { attachmentFolderPolicy=${cli.flags.attachmentFolderPolicy}, attachmentSubfolderName=${cli.flags.attachmentSubfolderName} }`);

exportQvlibrary(qvlibraryPath, outputPath, attachmentFolderPolicy);


function createAttachmentFolderPolicy(policyType: string, subfolderName: string): AttachmentFolderPolicy {

  switch (policyType) {
    case 'vaultFolder':
    case 'sameFolderAsEachFile':
      return createAttachmentFolderPolicyWithoutSubfolder(policyType);
    case 'subfolderUnderVault':
    case 'subfolderUnderEachFolder':
      return createAttachmentFolderPolicyWithSubfolder(policyType, subfolderName);
    default:
      throw new Error(`Unknown policy type: ${policyType}`);
  }
}
