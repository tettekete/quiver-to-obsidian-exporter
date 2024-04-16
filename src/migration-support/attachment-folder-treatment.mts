import pathlib from 'path'


const AttachmentFolderPolicyTypes = {
  vaultFolder: "vaultFolder",
  subfolderUnderVault: "subfolderUnderVault",
  sameFolderAsEachFile: "sameFolderAsEachFile",
  subfolderUnderEachFolder: "subfolderUnderEachFolder",
} as const;

export type AttachmentFolderPolicy =
  | { type: typeof AttachmentFolderPolicyTypes.vaultFolder }
  | {
      type: typeof AttachmentFolderPolicyTypes.subfolderUnderVault;
      subfolderName: string;
    }
  | { type: typeof AttachmentFolderPolicyTypes.sameFolderAsEachFile }
  | {
      type: typeof AttachmentFolderPolicyTypes.subfolderUnderEachFolder;
      subfolderName: string;
    };


export function createAttachmentFolderPolicyWithSubfolder(
  type:
    | typeof AttachmentFolderPolicyTypes.subfolderUnderVault
    | typeof AttachmentFolderPolicyTypes.subfolderUnderEachFolder,
  subfolderName: string
): AttachmentFolderPolicy {
  return { type, subfolderName };
}

export function createAttachmentFolderPolicyWithoutSubfolder(
  type:
    | typeof AttachmentFolderPolicyTypes.vaultFolder
    | typeof AttachmentFolderPolicyTypes.sameFolderAsEachFile
): AttachmentFolderPolicy {
  return { type };
}


export function calculateAttachmentFolderPath(rootPath: string, currentFolderPath: string, attachmentFolderPolicy: AttachmentFolderPolicy): string {

  switch (attachmentFolderPolicy.type) {
    case AttachmentFolderPolicyTypes.vaultFolder:
      return rootPath;
    case AttachmentFolderPolicyTypes.subfolderUnderVault:
      return pathlib.join(rootPath, attachmentFolderPolicy.subfolderName);
    case AttachmentFolderPolicyTypes.sameFolderAsEachFile:
      return currentFolderPath;
    case AttachmentFolderPolicyTypes.subfolderUnderEachFolder:
      return pathlib.join(currentFolderPath, attachmentFolderPolicy.subfolderName);
  }
}
