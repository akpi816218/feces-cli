#!/usr/bin/env node
import { homedir } from 'os';
import { join } from 'path';
import { error, log } from 'console';
import asTable from 'as-table';
import { access, constants, mkdir, rm, writeFile } from 'fs/promises';
import mv from 'mv';
import { argv, cwd } from 'process';
import { keyInYN } from 'readline-sync';
import Jsoning from 'jsoning';
import 'colors';
import colors from 'colors';
const bold = colors.bold;
function toTable(data) {
    return asTable.configure({
        title: (t) => bold(t),
        delimiter: ' | '.yellow,
        dash: '-'.yellow
    })(data);
}
argv.shift();
argv.shift();
Object.freeze(argv);
class Database extends Jsoning {
    constructor(path) {
        super(path);
    }
    async set(key, value) {
        return await super.set(key, value);
    }
    get(key) {
        return super.get(key);
    }
    all() {
        return super.all();
    }
}
class FecesError extends Error {
    name = 'FecesError';
    constructor(message) {
        super(message);
    }
}
function parseDuration(duration) {
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
const commandHandlers = {
    compost: async () => {
        const ts = Date.now();
        if (argv.length !== 2)
            throw new FecesError('Invalid number of subarguments (expected 1).'.red);
        const duration = argv[1];
        if (!duration.match(/^(\d+)([mhdwMy])$/) && duration != '0')
            throw new FecesError(`Invalid duration format (received '${duration}').`.red);
        const db = new Database(join(homedir(), '.feces', 'index.json')), splitdate = ts - parseDuration(duration);
        log('Composting files older than %s...'.yellow, splitdate);
        const toCompost = Object.entries(db.all()).filter(([, v]) => v.timestamp < splitdate);
        const table = [];
        for (const [key, filedata] of toCompost)
            table.push({
                id: key.cyan,
                originalPath: filedata.originalPath.blue
            });
        log('The following files will be composted (%d files):\n%s'.yellow, toCompost.length, toTable(table));
        if (keyInYN('Are you sure you want to continue?')) {
            for (const [k, v] of toCompost) {
                await rm(v.newPath);
                await db.delete(k);
            }
            log(`Composting complete (permanently deleted ${toCompost.length} files).`);
        }
        else
            log('Aborted.');
    },
    help: async () => {
        if (argv.length > 2)
            throw new FecesError('Invalid number of subarguments (expected 0-1).'.red);
        const mainstring = '%s  %s', singlestring = '%s:\n%s';
        if (argv.length == 1) {
            log('Available commands:'.magenta);
            log(mainstring, 'compost <duration>'.cyan, 'Compost (permanently delete) all files older than {duration}'.blue);
            log(mainstring, 'help              '.cyan, 'Show this help message.'.blue);
            log(mainstring, 'init              '.cyan, 'Initialize the feces environment.'.blue);
            log(mainstring, 'pie               '.cyan, 'List all plopped files.'.blue);
            log(mainstring, 'plop <file>       '.cyan, 'Plop a file. Path may be relative or absolute.'.blue);
            log(mainstring, 'plunge <file>     '.cyan, 'Plunge a plopped file. {file} must be one of the unique file IDs as listed in the pie command'
                .blue);
        }
        else {
            switch (argv[1]) {
                case 'compost':
                    log(singlestring, 'compost <duration>'.cyan, "Compost (permanently delete) all trashed files older than {duration}. {duration} must be an integer followed directly by a lowercase alphabetic character (i.e. '10h', '4d', '2mo', etc.). {duration} may also be set to '0', which will compost all trashed files."
                        .blue);
                    break;
                case 'help':
                    log(singlestring, 'help'.cyan, 'Show this help message.'.blue);
                    break;
                case 'init':
                    log(singlestring, 'init'.cyan, 'Initialize the feces environment. This will create a .feces directory in your home directory.'
                        .blue);
                    break;
                case 'pie':
                    log(singlestring, 'pie'.cyan, 'List all plopped files. This will print a table of all plopped (trashed) files, including their unique IDs and original paths (before trashing).'
                        .blue);
                    break;
                case 'plop':
                    log(singlestring, 'plop <file>'.cyan, "Plop a file. Path of {file} may be relative or absolute. This will move the file to the .feces/files directory and create a record of the file in the '~/.feces/index.json', indexed by its unique ID."
                        .blue);
                    break;
                case 'plunge':
                    log(singlestring, 'plunge <file>'.cyan, "Plunge a plopped file. {file} must be one of the unique file IDs as listed in the pie command. This will move the file from the .feces/files directory back to its original path and remove the record of the file from '~/.feces/index.json'."
                        .blue);
                    break;
                default:
                    throw new FecesError(`Invalid subargument '${argv[1]}': No such command`.red);
            }
        }
    },
    init: async () => {
        const home = homedir(), fecespath = join(home, '.feces');
        log('Initializing the feces environment...'.green);
        try {
            await mkdir(fecespath);
            await mkdir(join(fecespath, 'files'));
            await writeFile(join(fecespath, 'info'), '{}');
            log('Initialization complete.'.green);
        }
        catch (err) {
            throw new FecesError('Failed to initialize the feces environment; either already initialized, lacking permissions, or other problems.'.red);
        }
    },
    pie: async () => {
        if (argv.length > 1)
            throw new FecesError('Invalid number of subarguments (expected 0).'.red);
        const db = new Database(join(homedir(), '.feces', 'index.json')), all = Object.entries(db.all());
        if (all.length === 0) {
            log('No files have been plopped yet.'.yellow);
            return;
        }
        const table = [];
        for (const [_key, filedata] of Object.entries(all))
            table.push({
                id: filedata[0].cyan,
                originalPath: filedata[1].originalPath.blue
            });
        log(toTable(table));
    },
    plop: async () => {
        if (argv.length !== 2)
            throw new FecesError('Invalid number of subarguments (expected 2).'.red);
        const ts = Date.now(), name = `${ts}-${argv[1]}`, filepath = join(cwd(), argv[1]), db = new Database(join(homedir(), '.feces', 'index.json')), newpath = join(homedir(), '.feces', 'files', name);
        try {
            await access(argv[1], constants.F_OK | constants.R_OK | constants.W_OK);
        }
        catch (err) {
            throw new FecesError('File does not exist or access is denied.'.red);
        }
        mv(argv[1], newpath, () => { });
        await db.set(name, {
            originalPath: filepath,
            newPath: newpath,
            timestamp: ts
        });
        log("File '%s' plopped successfully.".green, argv[1]);
    },
    plunge: async () => {
        if (argv.length !== 2)
            throw new FecesError('Invalid number of subarguments (expected 2).'.red);
        const name = argv[1], db = new Database(join(homedir(), '.feces', 'index.json')), fd = db.get(name);
        if (!fd)
            throw new FecesError('There is no such plopped file.'.red);
        mv(fd.newPath, fd.originalPath, () => { });
        await db.delete(name);
        log("File '%s' plunged successfully to '%s'.".green, name, fd.originalPath);
    }
};
async function main() {
    if (argv.length === 0)
        throw new FecesError("No command specified. Use 'feces help' to see available commands.".yellow);
    const cmnd = argv[0];
    if (commandHandlers[cmnd] === undefined) {
        throw new FecesError(`Command '${cmnd}' not found. Use 'feces help' to see available commands.`.yellow);
    }
    else
        commandHandlers[cmnd]().catch((err) => error(err.message));
}
main().catch((err) => error(err.message));
