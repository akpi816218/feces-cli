#!/usr/bin/env node
import { error, log } from 'console';
import asTable from 'as-table';
import { cwd } from 'process';
import { keyInYN } from 'readline-sync';
import 'colors';
import colors from 'colors';
import { program } from 'commander';
import { commandHandlers } from '../internals/src/internals.js';
const bold = colors.bold;
function toTable(data) {
    return asTable.configure({
        title: (t) => bold(t),
        delimiter: ' | '.yellow,
        dash: '-'.yellow
    })(data);
}
const localCommandHandlers = {
    compost: async (duration) => {
        try {
            await commandHandlers.compost(duration, (msg, data) => {
                log('Composting files older than %s...'.yellow, msg);
                const table = [];
                for (const [key, filedata] of data)
                    table.push({
                        id: key.cyan,
                        originalPath: filedata.originalPath.blue
                    });
                if (table.length == 0)
                    log('No files to compost.'.yellow);
                log('The following files will be composted (%d files):\n%s'.yellow, data.length, toTable(table));
            }, () => !!keyInYN('Are you sure you want to continue?'));
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
    init: async () => {
        try {
            await commandHandlers.init();
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
    pie: async () => {
        try {
            const table = [];
            for (const [key, filedata] of await commandHandlers.pie())
                table.push({
                    id: key.cyan,
                    originalPath: filedata.originalPath.blue
                });
            if (table.length == 0)
                log('No plopped files.'.yellow);
            else
                log(toTable(table));
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
    plop: async (file) => {
        try {
            log("File '%s' plopped successfully.".green, (await commandHandlers.plop(cwd(), file)).originalPath);
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
    plunge: async (file) => {
        try {
            log("File '%s' plunged successfully to '%s'.".green, file, (await commandHandlers.plunge(file)).originalPath);
        }
        catch (err) {
            error(err.message.red || err);
        }
    }
};
program
    .command('compost')
    .description('Compost (permanently delete) all files older than <duration>')
    .argument('<duration>', 'The cutoff duration to compost files older than')
    .action(localCommandHandlers.compost);
program
    .command('init')
    .description('Initialize the feces environment')
    .action(localCommandHandlers.init);
program
    .command('pie')
    .description('List all plopped files')
    .action(localCommandHandlers.pie);
program
    .command('plop')
    .description('Plop a file')
    .argument('<file>', 'The file to plop')
    .action(localCommandHandlers.plop);
program
    .command('plunge')
    .description('Plunge a plopped file')
    .argument('<file>', 'The file to plunge')
    .action(localCommandHandlers.plunge);
try {
    program.parse();
}
catch (err) {
    log(err.message.red || err);
}
