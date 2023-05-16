declare module '@feces-cli/internals';

export interface FileData {
	originalPath: string;
	trashedPath: string;
	timestamp: number;
}

export class FecesError extends Error {
	constructor(message: string);
}

export class Database<T> {
	constructor(path: string);
	set(key: string, value: T): Promise<void>;
	get(key: string): T | undefined;
	delete(key: string): Promise<void>;
	all(): { [key: string]: T };
}

export function parseDuration(duration: string): number;

export const commandHandlers: {
	compost: (
		duration: string,
		log1: (benchmarkDate: number, data: [string, FileData][]) => void,
		verifyFn: (files: [string, FileData][]) => boolean
	) => Promise<boolean | 0>;
	init: () => Promise<boolean>;
	pie: () => Promise<[string, FileData][]>;
	plop: (cwd: string, file: string) => Promise<FileData>;
	plunge: (file: string) => Promise<FileData>;
};
