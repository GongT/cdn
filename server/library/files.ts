import {copy, mkdirpSync} from "fs-extra";
import {resolve} from "path";
import {fileExists} from "./file-exists";

const ROOT = resolve(__dirname, '../..') + '/';

const LOC_STORAGE = resolve(ROOT, 'source-storage') + '/';
const LOC_BUNDLE = resolve(LOC_STORAGE, 'bundles') + '/';

const LOC_TEMPL = resolve(ROOT, 'public/template') + '/';
const LOC_VIEWS = resolve(ROOT, 'public/view') + '/';

export async function initStorage() {
	mkdirpSync(LOC_BUNDLE);
	
	const pkg = resolve(LOC_STORAGE, 'package.json');
	if (!await fileExists(pkg)) {
		await copy(resolve(LOC_TEMPL, 'package.json'), pkg);
	}
}

export function getViewsFolder() {
	return LOC_VIEWS;
}
export function getBundleFolder() {
	return LOC_BUNDLE;
}
export function getStorageBaseFolder() {
	return LOC_STORAGE;
}

export function getBundleLocation(library: string) {
	return LOC_BUNDLE + library + '.js';
}

export function getJspmConfigFile() {
	return LOC_STORAGE + 'jspm.config.js';
}


