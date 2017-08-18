import {loadSystemjsConfigFile} from "@gongt/ts-stl-server/express/render/jspm";
import {getJspmConfigFile, getPackageConfigFile} from "../library/files";
import {installedPackageNames, installedPackages} from "../library/local-package-list";
import {generateJspmConfig} from "../route/jspm.config";
import {jspmBundleCache} from "./install.function";
import {splitName, TransitionHandler} from "./socket-handler";

let timer, cache: string[];

export function getDependencies(): string[] {
	if (cache) {
		return cache;
	}
	const pkgFile = getPackageConfigFile();
	if (!timer) {
		timer = setImmediate(() => {
			timer = null;
			cache = null;
			delete require.cache[require.resolve(pkgFile)];
		});
	}
	return cache = Object.keys(require(pkgFile).dependencies);
}

async function allDepsOpList(name: string, handler: TransitionHandler): Promise<string[]> {
	const oplist = [];
	for (const name of installedPackageNames()) {
		oplist.push('-', name);
	}
	return oplist;
}

export async function createOpList(name: string, handler: TransitionHandler): Promise<string[]> {
	const opList = [];
	const [registry, base] = splitName(name);
	
	const config = loadSystemjsConfigFile(getJspmConfigFile());
	const full = <string>config.map[base];
	if (typeof full !== 'string') {
		return allDepsOpList(name, handler)
	}
	const pkg = config.packages[full];
	if (!pkg || !pkg.map) {
		return allDepsOpList(name, handler)
	}
	const pkgs = Object.values(pkg.map);
	
	const installed = installedPackageNames();
	for (const name of pkgs) {
		const [_, base] = splitName(name);
		if (installed.indexOf(base) === -1) {
			continue;
		}
		
		opList.push('-');
		opList.push(`[${name}/**/*]`);
	}
	return opList;
}
