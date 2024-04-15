

export type LogConfig = {
  isVerbose: boolean;
};


export const createLogger = (config: LogConfig) => {
  return {

    debugNotebookPathsByUUID: (notebookPathsByUUID: Map<string, string>) => {
      if (!config.isVerbose) return;
      debugNotebookPathsByUUID(notebookPathsByUUID);
    },
  };
};


const debugNotebookPathsByUUID = (notebookPathsByUUID: Map<string, string>) => {

  console.log(`==== contents of notebookPathsByUUID ====`);
  notebookPathsByUUID.forEach((value, key) => {
    console.log(`Key: ${key}, Value: ${value}`);
  });
}
