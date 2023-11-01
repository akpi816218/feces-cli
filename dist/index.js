#!/usr/bin/env node
import 'colors';
import { error } from 'console';
import asTable from 'as-table';
import { cwd, env, exit, stderr, stdout } from 'process';
// @deno-types=@types/readline-sync
import { keyInYN } from 'readline-sync';
import 'colors';
import colors from 'colors';
import { program } from 'commander';
// import blessed from 'blessed';
import { commandHandlers, parseDuration } from './internals';
const { bold, disable: disableColors } = colors;
// deno-lint-ignore no-explicit-any
function toTable(data) {
    return asTable.configure({
        title: (t) => bold(t),
        delimiter: ' | '.yellow,
        dash: '-'.yellow,
    })(data);
}
// ! Make sure to change the version number in both package.json and src/index.ts
const version = '2.5.0';
import fetch from 'npm-registry-fetch';
env.NO_COLOR !== undefined && env.NO_COLOR !== '' && disableColors();
const localCommandHandlers = {
    compost: async (duration, { yes }) => {
        try {
            duration = duration ?? '0';
            const f = await commandHandlers.compost(duration, (dt, data) => {
                stdout.write(`Composting files older than ${dt}...\n`.yellow);
                const table = [];
                for (const [key, filedata] of data) {
                    table.push({
                        id: key.cyan,
                        originalPath: filedata.originalPath.blue,
                    });
                }
                if (table.length == 0)
                    stdout.write('No files to compost.'.yellow);
                stdout.write(`The following files will be composted (${data.length} files):\n${toTable(table)}\n`.yellow);
            }, () => yes || !!keyInYN('Are you sure you want to continue?'));
            if (f === 0) {
                stdout.write(`No plopped files to compost older than ${Date.now() - parseDuration(duration)}.\n`.yellow);
            }
            else if (f === true)
                stdout.write('Composted files successfully.\n'.green);
            else
                stdout.write('Composting aborted.\n'.yellow);
        }
        catch (err) {
            stderr.write(err.message.red || err);
        }
    },
    init: async () => {
        try {
            await commandHandlers.init();
            stdout.write('Feces environment initialized successfully.\n'.green);
        }
        catch (err) {
            stderr.write('Failed to initialize the feces environment.\n');
        }
    },
    /**
        interactive: async () => {
            const win = blessed.screen({
                smartCSR: true,
                title: 'Feces Interactive',
                dockBorders: true,
                fullUnicode: true
            });
            win.key(['escape', 'q', 'C-c'], () => win.destroy());
            const table = blessed.listtable({
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'line',
                tags: true,
                keys: true,
                vi: true,
                mouse: true,
                align: undefined
            });
            table.focus();
            win.append(table);
            table.setData([
                ['ID'.yellow, 'Original Path'.yellow],
                ...(await commandHandlers.pie()).map(([key, filedata]) => [
                    key.cyan,
                    filedata.originalPath.blue
                ])
            ]);
            win.render();
        },
    */
    pie: async () => {
        try {
            const table = [];
            for (const [key, filedata] of await commandHandlers.pie()) {
                table.push({
                    id: key.cyan,
                    originalPath: filedata.originalPath.blue,
                });
            }
            if (table.length == 0)
                stdout.write('No plopped files.\n'.yellow);
            else
                stdout.write(toTable(table) + '\n');
            // deno-lint-ignore no-explicit-any
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
    plop: async (file) => {
        try {
            stdout.write(`File '${(await commandHandlers.plop(cwd(), file)).originalPath}' plopped successfully.\n`.green);
            // deno-lint-ignore no-explicit-any
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
    plunge: async (file) => {
        try {
            stdout.write(`File '${file}' plunged successfully to '${(await commandHandlers.plunge(file)).originalPath}'.\n`.green);
        }
        catch (err) {
            error(err.message.red || err);
        }
    },
};
program.name('feces').version(version);
program
    .command('compost')
    .description('Compost (permanently delete) all files older than <duration>')
    .argument('[duration]', 'The cutoff duration to compost files older than', '0')
    .option('-y|--yes', 'Skip confirmation')
    .action(localCommandHandlers.compost);
program
    .command('init')
    .description('Initialize the feces environment')
    .action(localCommandHandlers.init);
/**
    program
        .command('interactive')
        .description('Start up an interactive feces session')
        .aliases(['i', '-i', '--interactive'])
        .action(localCommandHandlers.interactive);
*/
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
program
    .command('version')
    .description('Print the version of feces-cli and check for updates')
    .aliases(['v', '-v', '--version'])
    .action(async () => {
    stdout.write(`Local installation is tsfm @${version}\n`.green +
        `Fetching package info from NPM, stand by for up to 5 seconds...\n`
            .cyan);
    stdout.write(`tsfm@latest version published on  ${(await fetch
        .json('tsfm', {
        timeout: 5000,
    })
        .catch(() => {
        stdout.write('Failed to fetch version info from NPM\n');
        exit(1);
    }))['dist-tags'].latest.magenta}\n`.blue);
    exit(0);
});
try {
    program.parse();
    // deno-lint-ignore no-explicit-any
}
catch (err) {
    stderr.write(err.message.red || err);
}
