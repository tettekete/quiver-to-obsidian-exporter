import { parseBoolean } from './util/environment-variable-parser.mjs'


const isVerbose = parseBoolean(process.env.QUIVER_TO_OBSIDIAN_EXPORTER_LOGGING_VERBOSE);


type LogConfig = {
  isVerbose: boolean;
  toString(): string;
};

const logConfig: LogConfig = {
  isVerbose: isVerbose,
  toString: function() {
    return `LogConfig: { isVerbose: ${this.isVerbose} }`;
  }
};


const createLogger = (config: LogConfig) => {

  if (config.isVerbose) {
    console.log(`LogConfig=${config.toString()}`)
  }

  return {

    error: (message: string) => console.error(message),
    forceInfo: (message: string) => console.info(message),

    info: (message: string) => {
      if (!config.isVerbose) return;
      console.info(message)
    },

    debug: (message: string) => {
      if (!config.isVerbose) return;
      console.debug(message)
    },

    debugNotebookPathsByUUID: (notebookPathsByUUID: Map<string, string>) => {
      if (!config.isVerbose) return;
      debugNotebookPathsByUUID(notebookPathsByUUID);
    },

    completed: () => {
      console.info('')
      console.info("🎉 The export of the Quiver library to the Obsidian Vault has been completed successfully.")
    },
  };
};


const debugNotebookPathsByUUID = (notebookPathsByUUID: Map<string, string>) => {

  console.debug(`==== contents of notebookPathsByUUID ====`);
  notebookPathsByUUID.forEach((value, key) => {
    console.debug(`Key: ${key}, Value: ${value}`);
  });
}


let loggerInstance = createLogger(logConfig);

export const getLogger = () => {
  return loggerInstance;
};

