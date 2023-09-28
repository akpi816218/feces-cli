// ex. scripts/build_npm.ts
import { build, emptyDir } from 'https://deno.land/x/dnt@0.38.1/mod.ts';

await emptyDir('./npm');

await build({
	entryPoints: ['./src/feces-cli.ts'],
	outDir: './npm',
	shims: {
		// see JS docs for overview and more options
		deno: true,
	},
	package: {
		name: 'feces-cli',
		version: '1.3.1',
		type: 'module',
		bin: {
			feces: 'esm/feces-cli.js',
		},
		author: {
			name: 'Akhil Pillai',
			email: 'feces-cli@akpi.is-a.dev',
			url: 'https://akpi.is-a.dev',
		},
		description:
			'A creatively named trash file manager built for the command line.',
		license: 'GPL-3.0',
		repository: {
			type: 'git',
			url: 'git+https://github.com/akpi816218/feces-cli.git',
		},
		bugs: {
			url: 'https://github.com/akpi816218/feces-cli/issues',
		},
	},
	postBuild() {
		Deno.copyFileSync('./LICENSE', './npm/LICENSE');
		Deno.copyFileSync('./README.md', './npm/README.md');
	},
	declaration: false,
	esModule: true,
	packageManager: 'npm',
	scriptModule: false,
	skipSourceOutput: true,
	test: false,
});
