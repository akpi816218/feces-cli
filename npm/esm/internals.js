import * as dntShim from "./_dnt.shims.js";
import { homedir } from 'os';
import { join } from 'path';
import { access } from 'fs/promises';
import { constants, writeFile } from 'fs/promises';
import mv from 'mv';
import Database from 'typed-jsoning';
class FecesError extends Error {
    constructor(message) {
        super(message);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'FecesError'
        });
    }
}
export function parseDuration(duration) {
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
    compost: async (duration, log1, verifyFn) => {
        try {
            await access(join(homedir(), '.feces', 'index.json'), constants.F_OK & constants.W_OK);
        }
        catch (_err) {
            throw new FecesError('Not initialized');
        }
        const db = new Database(join(homedir(), '.feces', 'index.json'));
        const ts = Date.now();
        if (!duration.match(/^(\d+)([mhdwMy])$/) && duration != '0')
            throw new FecesError(`Invalid duration format (received '${duration}').`);
        const splitdate = ts - parseDuration(duration);
        const toCompost = Object.entries(db.all()).filter(([, v]) => v.timestamp < splitdate);
        if (toCompost.length == 0)
            return 0;
        log1(splitdate, toCompost);
        if (verifyFn(toCompost)) {
            for (const [k, v] of toCompost) {
                await dntShim.Deno.remove(v.trashedPath, { recursive: true });
                await db.delete(k);
            }
            return true;
        }
        else
            return false;
    },
    init: async () => {
        const home = homedir(), fecespath = join(home, '.feces');
        try {
            await dntShim.Deno.mkdir(join(fecespath, 'files'), { recursive: true });
            await writeFile(join(fecespath, 'index.json'), '{}');
            return true;
        }
        catch (_err) {
            throw new FecesError('Failed to initialize the feces environment; either already initialized, lacking permissions, or other problems.');
        }
    },
    pie: async () => {
        try {
            await access(join(homedir(), '.feces', 'index.json'), constants.F_OK & constants.W_OK);
        }
        catch (_err) {
            throw new FecesError('Not initialized');
        }
        const db = new Database(join(homedir(), '.feces', 'index.json'));
        return Object.entries(db.all());
    },
    plop: async (cwd, file) => {
        try {
            await access(join(homedir(), '.feces', 'index.json'), constants.F_OK & constants.W_OK);
        }
        catch (_err) {
            throw new FecesError('Not initialized');
        }
        const db = new Database(join(homedir(), '.feces', 'index.json'));
        const ts = Date.now(), name = `${ts}-${file}`, filepath = join(cwd, file), newpath = join(homedir(), '.feces', 'files', name);
        try {
            await access(filepath, constants.F_OK | constants.R_OK | constants.W_OK);
        }
        catch (_err) {
            throw new FecesError('File does not exist or access is denied.');
        }
        mv(filepath, newpath, (error) => {
            if (error)
                throw new FecesError('Failed to move file.');
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
    plunge: async (file) => {
        try {
            await access(join(homedir(), '.feces', 'index.json'), constants.F_OK & constants.W_OK);
        }
        catch (_err) {
            throw new FecesError('Not initialized');
        }
        const db = new Database(join(homedir(), '.feces', 'index.json'));
        const fd = db.get(file);
        if (!fd)
            throw new FecesError('There is no such plopped file.');
        mv(fd.trashedPath, fd.originalPath, () => { });
        await db.delete(file);
        return fd;
    }
};
