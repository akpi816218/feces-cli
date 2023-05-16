#!/usr/bin/env node

import { homedir } from 'os';
import { join } from 'path';
import { access, constants, mkdir, readFile, rm, writeFile } from 'fs/promises';
import mv from 'mv';
import Jsoning from 'jsoning';

export interface FileData {
	originalPath: string;
	trashedPath: string;
	timestamp: number;
}

export class Database<T> extends Jsoning {
	constructor(path: string) {
		super(path);
	}

	async set(key: string, value: T): Promise<boolean> {
		return await super.set(key, value);
	}

	get(key: string): T | undefined {
		return super.get(key);
	}

	all(): { [key: string]: T } {
		return super.all();
	}
}

class FecesError extends Error {
	name = 'FecesError';
	constructor(message: string) {
		super(message);
	}
}

export function parseDuration(duration: string): number {
	const match = duration.match(/^(\d+)([mhdwMy])$/);
	if (match) {
		const num = parseInt(match[1]);
		const unit = match[2];
		switch (unit) {
			case 's':
				return num * 1000;
			case 'm':
				return num * 60000;
			case 'h':
				return num * 3600000;
			case 'd':
				return num * 86400000;
			case 'w':
				return num * 604800000;
			case 'M':
				return num * 2629800000;
			case 'y':
				return num * 31557600000;
		}
	}
	return 0;
}

export const commandHandlers = {
	compost: async (
		duration: string,
		log1: (benchmarkDate: number, data: [string, FileData][]) => void,
		verifyFn: (files: [string, FileData][]) => boolean
	): Promise<boolean | 0> => {
		try {
			await access(
				join(homedir(), '.feces', 'index.json'),
				constants.F_OK & constants.W_OK
			);
		} catch (err) {
			throw new FecesError('Not initialized');
		}
		const db = new Database<FileData>(join(homedir(), '.feces', 'index.json'));
		const ts = Date.now();
		if (!duration.match(/^(\d+)([mhdwMy])$/) && duration != '0')
			throw new FecesError(`Invalid duration format (received '${duration}').`);
		const splitdate = ts - parseDuration(duration);
		const toCompost = Object.entries(db.all()).filter(
			([, v]) => v.timestamp < splitdate
		);
		if (toCompost.length == 0) return 0;
		log1(splitdate, toCompost);
		if (verifyFn(toCompost)) {
			for (const [k, v] of toCompost) {
				await rm(v.trashedPath, { recursive: true });
				await db.delete(k);
			}
			return true;
		} else return false;
	},
	init: async (): Promise<boolean> => {
		const home = homedir(),
			fecespath = join(home, '.feces');
		try {
			await mkdir(fecespath);
			await mkdir(join(fecespath, 'files'));
			await writeFile(join(fecespath, 'index.json'), '{}');
			return true;
		} catch (err) {
			throw new FecesError(
				'Failed to initialize the feces environment; either already initialized, lacking permissions, or other problems.'
			);
		}
	},
	pie: async (): Promise<[string, FileData][]> => {
		try {
			await access(
				join(homedir(), '.feces', 'index.json'),
				constants.F_OK & constants.W_OK
			);
		} catch (err) {
			throw new FecesError('Not initialized');
		}
		const db = new Database<FileData>(join(homedir(), '.feces', 'index.json'));
		return Object.entries(db.all());
	},
	plop: async (cwd: string, file: string): Promise<FileData> => {
		try {
			await access(
				join(homedir(), '.feces', 'index.json'),
				constants.F_OK & constants.W_OK
			);
		} catch (err) {
			throw new FecesError('Not initialized');
		}
		const db = new Database<FileData>(join(homedir(), '.feces', 'index.json'));
		const ts = Date.now(),
			name = `${ts}-${file}`,
			filepath = join(cwd, file),
			newpath = join(homedir(), '.feces', 'files', name);
		try {
			await access(filepath, constants.F_OK | constants.R_OK | constants.W_OK);
		} catch (err) {
			throw new FecesError('File does not exist or access is denied.');
		}
		mv(filepath, newpath, (error?) => {
			if (error) throw new FecesError('Failed to move file.');
			else
				db.set(name, {
					originalPath: filepath,
					trashedPath: newpath,
					timestamp: ts
				});
		});
		return {
			originalPath: filepath,
			trashedPath: newpath,
			timestamp: ts
		};
	},
	plunge: async (file: string): Promise<FileData> => {
		try {
			await access(
				join(homedir(), '.feces', 'index.json'),
				constants.F_OK & constants.W_OK
			);
		} catch (err) {
			throw new FecesError('Not initialized');
		}
		const db = new Database<FileData>(join(homedir(), '.feces', 'index.json'));
		const fd = db.get(file);
		if (!fd) throw new FecesError('There is no such plopped file.');
		mv(fd.trashedPath, fd.originalPath, () => {});
		await db.delete(file);
		return fd;
	}
};
