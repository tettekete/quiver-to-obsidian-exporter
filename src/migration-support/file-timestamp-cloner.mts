import { utimes } from 'utimes';

import { getLogger } from '../logger.mjs';


const logger = getLogger();


export function cloneTimestamp(fileName: string, quiverMeta: any) {

  try {
    utimes(fileName, {
      btime: Number(quiverMeta.created_at * 1000),
      mtime: Number(quiverMeta.updated_at * 1000),
      atime: Number(quiverMeta.updated_at * 1000),
    }, function (err) {
      if (err) {
        logger.error(`Error occurred while updating the file timestamp. [err=${err}, file=${fileName}]`);
      } else {
        logger.debug(`The timestamp of the file has been updated successfully.`);
        // logger.debug(`The timestamp of the file [${fileName}] has been updated successfully.`);
      }
    });
  }
  catch (error) {
    logger.error(error);
  }
}
