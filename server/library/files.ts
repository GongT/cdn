import {loadSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm";
import {TextFile} from "@gongt/ts-stl-server/file-operation/text-file";
import {writeFileSync} from "fs";
import {copySync, mkdirpSync} from "fs-extra";
import {tmpdir} from "os";
import {resolve} from "path";
import {fileExistsSync} from "./file-exists";
import {initRunJspm} from "./run-cmd";

const ROOT = resolve(__dirname, '../..') + '/';

const LOC_STORAGE = resolve(ROOT, 'source-storage') + '/';
const LOC_BUNDLE_FOLDER = 'bundles';
const LOC_BUNDLE = resolve(LOC_STORAGE, LOC_BUNDLE_FOLDER) + '/';

const LOC_TEMP = resolve(JsonEnv.isDebug? LOC_STORAGE : tmpdir(), 'jspm-cdn-temp') + '/';
export const LOC_TEMPL = resolve(ROOT, 'public/template') + '/';
const LOC_VIEWS = resolve(ROOT, 'public/view') + '/';

export function initStorage() {
	mkdirpSync(LOC_BUNDLE);
	mkdirpSync(getTempFolder());
	mkdirpSync(resolve(getTempFolder(), 'ie-storage'));
	mkdirpSync(resolve(getTempFolder(), 'ie-bundle'));
	
	const pkg = getPackageConfigFile();
	if (!fileExistsSync(pkg)) {
		copySync(resolve(LOC_TEMPL, 'package.json'), pkg);
	}
	
	if (!fileExistsSync(getJspmConfigFile())) {
		initRunJspm('install', '--yes');
	}
	
	if (!fileExistsSync(LOC_STORAGE + 'jspm_packages/system.js')) {
		initRunJspm('dl-loader');
	}
	
	const file = getJspmConfigFile();
	const configs = loadSystemjsConfigFileMultiParts(file);
	let changed = false;
	for (const config of configs) {
		if (config.paths) {
			if (!config.paths["npm:@*"]) {
				config.paths["npm:@*"] = "jspm_packages/npm/@*";
				changed = true;
			}
		}
	}
	if (changed) {
		writeFileSync(file, configs.map((config) => {
			return `SystemJS.config(${JSON.stringify(config, null, 2)});`;
		}).join('\n\n'));
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

export function getBundleMapLocation(library: string) {
	return LOC_BUNDLE + library;
}

export function getBundleFileName(library: string) {
	return LOC_BUNDLE_FOLDER + '/' + library + '.js';
}

export function getBundleTempLocation(library: string) {
	return LOC_TEMP + library + '.js';
}

export function getBundleMapTempLocation(library: string) {
	return LOC_TEMP + library;
}

export function getLocalPackageList() {
	return new TextFile(LOC_STORAGE + 'package-list.txt', 'utf8', true);
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


