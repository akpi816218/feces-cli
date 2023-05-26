#!/usr/bin/env node

import { error, log } from 'node:console';
import asTable from 'npm:as-table';
import { cwd } from 'node:process';
// @deno-types=npm:@types/readline-sync
import { keyInYNStrict } from 'npm:readline-sync';
import 'npm:colors';
import colors from 'npm:colors';
import { program } from 'npm:commander';
import blessed from 'npm:blessed';

import { commandHandlers } from '../internals/src/internals.ts';

const bold = colors.bold;
// deno-lint-ignore no-explicit-any
function toTable(data: any[]): string {
	return asTable.configure({
		title: (t) => bold(t),
		delimiter: ' | '.yellow,
		dash: '-'.yellow
	})(data);
}

const localCommandHandlers = {
	compost: async (duration: string) => {
		try {
			if (!duration) duration = '0';
			await commandHandlers.compost(
				duration,
				(msg, data) => {
					log('Composting files older than %s...'.yellow, msg);
					const table = [];
					for (const [key, filedata] of data)
						table.push({
							id: key.cyan,
							originalPath: filedata.originalPath.blue
						});
					if (table.length == 0) log('No files to compost.'.yellow);
					log(
						'The following files will be composted (%d files):\n%s'.yellow,
						data.length,
						toTable(table)
					);
				},
				() => !!keyInYNStrict('Are you sure you want to continue?')
			);
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			error(err.message.red || err);
		}
	},
	init: async () => {
		try {
			await commandHandlers.init();
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			error(err.message.red || err);
		}
	},
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
	pie: async () => {
		try {
			const table = [];
			for (const [key, filedata] of await commandHandlers.pie())
				table.push({
					id: key.cyan,
					originalPath: filedata.originalPath.blue
				});
			if (table.length == 0) log('No plopped files.'.yellow);
			else log(toTable(table));
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			error(err.message.red || err);
		}
	},
	plop: async (file: string) => {
		try {
			log(
				"File '%s' plopped successfully.".green,
				(await commandHandlers.plop(cwd(), file)).originalPath
			);
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			error(err.message.red || err);
		}
	},
	plunge: async (file: string) => {
		try {
			log(
				"File '%s' plunged successfully to '%s'.".green,
				file,
				(await commandHandlers.plunge(file)).originalPath
			);
			// deno-lint-ignore no-explicit-any
		} catch (err: any) {
			error(err.message.red || err);
		}
	}
};

program
	.command('compost')
	.description('Compost (permanently delete) all files older than <duration>')
	.argument(
		'[duration]',
		'The cutoff duration to compost files older than',
		'0'
	)
	.action(localCommandHandlers.compost);
program
	.command('init')
	.description('Initialize the feces environment')
	.action(localCommandHandlers.init);
program
	.command('interactive')
	.description('Start up an interactive feces session')
	.aliases(['i', '-i', '--interactive'])
	.action(localCommandHandlers.interactive);
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
	// deno-lint-ignore no-explicit-any
} catch (err: any) {
	log(err.message.red || err);
}
