import {copySync, mkdirpSync} from "fs-extra";
import {tmpdir} from "os";
import {resolve} from "path";
import {fileExistsSync} from "./file-exists";
import {initRunJspm} from "./run-cmd";

const ROOT = resolve(__dirname, '../..') + '/';

const LOC_STORAGE = resolve(ROOT, 'source-storage') + '/';
const LOC_BUNDLE = resolve(LOC_STORAGE, 'bundles') + '/';

const LOC_TEMP = resolve(tmpdir(), 'jspm-cdn') + '/';
export const LOC_TEMPL = resolve(ROOT, 'public/template') + '/';
const LOC_VIEWS = resolve(ROOT, 'public/view') + '/';

export function initStorage() {
	mkdirpSync(LOC_BUNDLE);
	mkdirpSync(getTempFolder());
	
	const pkg = getPackageConfigFile();
	if (!fileExistsSync(pkg)) {
		copySync(resolve(LOC_TEMPL, 'package.json'), pkg);
	}
	
	if (!fileExistsSync(getJspmConfigFile())) {
		initRunJspm();
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
export function getBundleFileName(library: string) {
	return 'bundles/' + library + '.js';
}
export function getBundleTempLocation(library: string) {
	return LOC_TEMP + library + '.js';
}

export function getJspmConfigFile() {
	return LOC_STORAGE + 'jspm.config.js';
}
export function getPackageConfigFile() {
	return LOC_STORAGE + 'package.json';
}

export function getTempFolder() {
	return LOC_TEMP;
}


