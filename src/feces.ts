#!/usr/bin/env node

import { homedir } from 'os';
import { join } from 'path';
import { log } from 'console';
import { access, constants, mkdir, writeFile } from 'fs/promises';
import mv from 'mv';
import { argv, cwd } from 'process';
import Jsoning from 'jsoning';
argv.shift();
argv.shift();

const commandHandlers: { [key: string]: Function } = {
	init: async () => {
		const home = homedir(),
			fecespath = join(home, '.feces');
		log('Initializing the feces environment...');
		mkdir(fecespath);
		mkdir(join(fecespath, 'files'));
		writeFile(join(fecespath, 'info'), '{}');
		log('Initialization complete.');
	},
	pie: async () => {
		// TODO: Implement pie command
	},
	plop: async () => {
		if (argv.length !== 2) {
			process.exitCode = 1;
			log('Invalid number of arguments.');
			return;
		}
		const ts = Date.now(),
			name = `${ts}-${argv[1]}`,
			filepath = join(cwd(), argv[1]),
			db = new Jsoning(join(homedir(), '.feces', 'index.json')),
			newpath = join(homedir(), '.feces', 'files', name);
		try {
			await access(argv[1], constants.F_OK | constants.R_OK | constants.W_OK);
		} catch (err) {
			log('File does not exist or access is denied.');
			process.exitCode = 1;
			return;
		}
		mv(argv[1], newpath, (err) => {});
		await db.set(name, {
			originalPath: filepath,
			newPath: newpath,
			timestamp: ts
		});
	}
};

function main() {
	if (argv.length === 0) {
		log('No command specified. Use feces --help to see available commands.');
		process.exitCode = 1;
		return;
	}

	const cmnd = argv[0];
	if (commandHandlers[cmnd] === undefined) {
		log(
			`Command '${cmnd}' not found. Use feces --help to see available commands.`
		);
	} else commandHandlers[cmnd]();
}

main();
