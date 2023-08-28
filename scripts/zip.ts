import { compress } from 'https://deno.land/x/zip@v1.2.5/mod.ts';
import { readdir } from 'node:fs/promises';

for (const a of await readdir('./out')) {
	const f = `./out/${a}`;
	await compress(f, `${f}.zip`);
	await Deno.remove(f);
}
