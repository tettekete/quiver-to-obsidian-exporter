#!/usr/bin/env node
import meow from 'meow';

import { assertValidQvlibraryPath } from './assertions.mjs';
import { exportQvlibrary } from './quiver-to-obsidian-exporter.mjs';


const cli = meow(`
	Usage
	  $ quiver-markdown <input.qvlibrary> -o <output folder>

	Options
	  --output, -o Output folder

	Examples
	  $ quiver-markdown MyLibrary.qvlibrary -o dist
`, {
  importMeta: import.meta,
  flags: {
    output: {
      type: 'string',
      shortFlag: 'o',
    },
  },
});

if (cli.input.length < 1) {
  console.error('Please provide a qvlibrary file');
  process.exit(1);
}

if (!cli.flags.output) {
  console.error('Please provide an output folder');
  process.exit(1);
}

const qvlibraryPath = cli.input[0]
assertValidQvlibraryPath(qvlibraryPath);

const outputPath = cli.flags.output

exportQvlibrary(qvlibraryPath, outputPath);
