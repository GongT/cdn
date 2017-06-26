import {loadSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm";
import {getJspmConfigFile, getPackageConfigFile} from "../library/files";
import {generateJspmConfig} from "../route/jspm.config";
import {jspmBundleCache} from "./install.function";
import {splitName, TransitionHandler} from "./socket-handler";
import {findFullFormat} from "./uninstall.function";

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

export function createOpList(name: string): string[] {
	const opList = [];
	const [registry, base] = splitName(name);
	
	const configs = loadSystemjsConfigFileMultiParts(getJspmConfigFile());
	
	getDependencies().forEach((name) => {
		if (name === base) {
			return;
		}
		
		opList.push('-');
		const fullPackageName = findFullFormat(configs, name);
		if (fullPackageName) {
			opList.push(`[${fullPackageName}/**/*]`);
		} else {
			opList.push(`[${name}/**/*]`);
		}
	});
	return opList;
}
export async function handleCleanup(handler: TransitionHandler, spark: any, fn: string, args: string[]) {
	const list = args.length? args : getDependencies();
	
	spark.write(`bundles all:\n ::  ${list.join('\n ::  ')}\n`);
	const argsOpList = list.map((name) => {
		const opList: string[] = createOpList(name);
		return {
			name,
			opList: opList,
		};
	});
	for (let {name, opList} of argsOpList) {
		spark.write(`bundle ${name}:\n`);
		await jspmBundleCache(name, opList, handler);
	}
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}
