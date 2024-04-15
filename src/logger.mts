

export type LogConfig = {
  isVerbose: boolean;
};


export const createLogger = (config: LogConfig) => {
  return {

    info: (message: string) => console.log(message),

    debug: (message: string) => {
      if (!config.isVerbose) return;
      console.log(message)
    },

    debugNotebookPathsByUUID: (notebookPathsByUUID: Map<string, string>) => {
      if (!config.isVerbose) return;
      debugNotebookPathsByUUID(notebookPathsByUUID);
    },

    completed: () => {
      console.log('')
      console.log("🎉 the export of the Quiver library to the Obsidian Vault has been completed successfully.")
    },
  };
};


const debugNotebookPathsByUUID = (notebookPathsByUUID: Map<string, string>) => {

  console.log(`==== contents of notebookPathsByUUID ====`);
  notebookPathsByUUID.forEach((value, key) => {
    console.log(`Key: ${key}, Value: ${value}`);
  });
}
