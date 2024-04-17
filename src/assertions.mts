import fs from "fs-extra";

import { getLogger } from './logger.mjs';


const logger = getLogger();


export function assertValidQvlibraryPath(qvlibraryPath: string) {

  if (!fs.existsSync(qvlibraryPath)) {
    logger.error(`The specified qvlibraryPath does not exist. [qvlibraryPath=${qvlibraryPath}]`);
    process.exit(2);
  }

  if (!fs.statSync(qvlibraryPath).isDirectory()) {
    logger.error(`The specified qvlibraryPath is not a directory. [qvlibraryPath=${qvlibraryPath}]`);
    process.exit(2);
  }
}
