import {pathExistsSync, readFile} from "fs-extra";
import {splitName, TransitionHandler} from "../provider/socket-handler";
import {fileExistsSync} from "./file-exists";

const cache: any = {};
const hasIndex: any = {};
export function removePackageCmdItemCache(name: string) {
	const [registry, base] = splitName(name);
	delete cache[base];
	delete hasIndex[base];
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
	if (!path) {
		return base;
	}
	if (pathExistsSync(path)) {
		if (fileExistsSync(path + '.json')) { // exists: no main
			const pkg = JSON.parse(await readFile(path + '.json', {encoding: 'utf8'}));
			if (!pkg.main) {
				packageIndex = `[${base}/**/*.js]`;
			}
			cache[base] = packageIndex;
			hasIndex[base] = pkg.main;
		} else { // .js file exists: has main
			cache[base] = base;
			hasIndex[base] = true;
		}
	}
	
	return packageIndex;
}
