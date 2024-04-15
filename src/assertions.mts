import fs from "fs-extra";


export function assertValidQvlibraryPath(qvlibraryPath: string) {

  if (!fs.existsSync(qvlibraryPath)) {
    console.log(`The specified qvlibraryPath does not exist. [qvlibraryPath=${qvlibraryPath}]`);
    process.exit(2);
  }

  if (!fs.statSync(qvlibraryPath).isDirectory()) {
    console.log(`The specified qvlibraryPath is not a directory. [qvlibraryPath=${qvlibraryPath}]`);
    process.exit(2);
  }
}
