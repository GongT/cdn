import {writeFileSync} from "fs";
import {pathExistsSync, readFile} from "fs-extra";
import {resolve} from "path";
import {splitName, TransitionHandler} from "../provider/socket-handler";
import {fileExistsSync} from "./file-exists";
import {getStorageBaseFolder} from "./files";

const cache: any = {};
const hasIndex: any = {};

const storPath = resolve(getStorageBaseFolder(), 'package-name-cache.json');
if (fileExistsSync(storPath)) {
	const content = require(storPath);
	Object.assign(cache, content.cache);
	Object.assign(hasIndex, content.hasIndex);
}

let timer;

function save() {
	if (timer) {
		clearTimeout(timer);
	}
	timer = setTimeout(() => {
		timer = null;
		console.log('save package resolve cache.');
		writeFileSync(storPath, JSON.stringify({cache, hasIndex}, null, 2), {encoding: 'utf8'});
	}, 4000);
}

export function removePackageCmdItemCache(name: string) {
	const [registry, base] = splitName(name);
	delete cache[base];
	delete hasIndex[base];
	save();
}

export async function packageHasMainIndex(name: string, handler: TransitionHandler) {
	const [registry, base] = splitName(name);
	if (hasIndex.hasOwnProperty(base)) {
		return hasIndex[base];
	}
	await resolvePackageCmdItem(name, handler);
	return hasIndex[base];
}

export async function resolvePackageCmdItem(name: string, handler: TransitionHandler) {
	const [registry, base] = splitName(name);
	if (cache.hasOwnProperty(base)) {
		return cache[base];
	}
	
	let packageIndex = base;
	await handler.create([
		'normalize',
		base,
	], true);
	const path = handler.lastOutput.trim().replace(/^file:\/\//, '');
	if (!path || path.startsWith('@')) {
		cache[base] = base;
		hasIndex[base] = true;
		save();
		return base;
	}
	if (pathExistsSync(path)) {
		if (fileExistsSync(path + '.json')) { // exists: no main
			const pkg = JSON.parse(await readFile(path + '.json', {encoding: 'utf8'}));
			if (!pkg.main) {
				packageIndex = `[${base}/**/*.js]`;
			}
			cache[base] = packageIndex;
			hasIndex[base] = pkg.main || false;
		} else { // .js file exists: has main
			cache[base] = base;
			hasIndex[base] = true;
		}
		save();
	}
	
	return packageIndex;
}
