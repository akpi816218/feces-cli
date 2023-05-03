#!/usr/bin/env node

import { homedir } from 'os';
import { join } from 'path';
import { log } from 'console';
import { access, constants, mkdir, writeFile } from 'fs/promises';
import mv from 'mv';
import { argv, cwd } from 'process';
import Jsoning from 'jsoning';
import 'colors';
argv.shift();
argv.shift();

interface FileData {
	originalPath: string;
	newPath: string;
	timestamp: number;
}

class Database<T> extends Jsoning {
	constructor(path: string) {
		super(path);
	}

	async set(key: string, value: T): Promise<boolean> {
		return await super.set(key, value);
	}

	get(key: string): Promise<T> {
		return super.get(key);
	}

	all(): { [key: string]: T } {
		return super.all();
	}
}

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
		if (argv.length > 1) {
			process.exitCode = 1;
			log('Invalid number of arguments.'.red);
			return;
		}
		const db = new Database<FileData>(join(homedir(), '.feces', 'index.json')),
			all = Object.entries(db.all());
		if (all.length === 0) {
			log('No files have been plopped yet.'.yellow);
			return;
		}
		for (const [_key, filedata] of Object.entries(all)) {
			log(
				'%s %s %s',
				filedata[0].cyan,
				'-'.yellow,
				filedata[1].originalPath.blue
			);
		}
	},
	plop: async () => {
		if (argv.length !== 2) {
			process.exitCode = 1;
			log('Invalid number of arguments.'.red);
			return;
		}
		const ts = Date.now(),
			name = `${ts}-${argv[1]}`,
			filepath = join(cwd(), argv[1]),
			db = new Database<FileData>(join(homedir(), '.feces', 'index.json')),
			newpath = join(homedir(), '.feces', 'files', name);
		try {
			await access(argv[1], constants.F_OK | constants.R_OK | constants.W_OK);
		} catch (err) {
			log('File does not exist or access is denied.'.red);
			process.exitCode = 1;
			return;
		}
		mv(argv[1], newpath, () => {});
		await db.set(name, {
			originalPath: filepath,
			newPath: newpath,
			timestamp: ts
		});
		log('File %s plopped successfully.'.green, argv[1]);
	}
};

function main() {
	if (argv.length === 0) {
		log(
			'No command specified. Use feces --help to see available commands.'.yellow
		);
		process.exitCode = 1;
		return;
	}

	const cmnd = argv[0];
	if (commandHandlers[cmnd] === undefined) {
		{
			log(
				`Command '${cmnd}' not found. Use feces --help to see available commands.`
					.yellow
			);
			process.exitCode = 1;
			return;
		}
	} else commandHandlers[cmnd]();
}

main();
