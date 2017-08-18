import {SystemjsConfigFile} from "@gongt/ts-stl-client/jspm/defines";
import {loadSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm";
import {saveSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm.write";
import {unlink} from "fs-extra";
import {fileExists} from "../library/file-exists";
import {getBundleFileName, getBundleLocation, getBundleTempLocation, getJspmConfigFile} from "../library/files";
import {installedPackages} from "../library/local-package-list";
import {generateJspmConfig} from "../route/jspm.config";
import {jspmBundleCache} from "./install.function";
import {splitName, TransitionHandler} from "./socket-handler";

export async function handleBundleCreate(handler: TransitionHandler, spark: any, args: string[], production: boolean) {
	const list = args.length? args : installedPackages();
	
	spark.write(`bundles all:\n ::  ${list.join('\n ::  ')}\n`);
	for (const name of list) {
		spark.write(`bundle ${name}:\n`);
		await jspmBundleCache(name, handler, spark, production);
	}
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}

export async function handleBundleDelete(handler: TransitionHandler, spark: any, args: string[]) {
	if (!args.length) {
		args = installedPackages();
	}
	await unbundle(handler, spark, args);
}

export function removeFromBundle(configs: SystemjsConfigFile[], remove: string) {
	const targetRel = getBundleFileName(remove);
	for (const config of configs) {
		if (config.bundles) {
			delete config.bundles[targetRel];
		}
		if (config.browserConfig && config.browserConfig.bundles) {
			delete config.browserConfig.bundles[targetRel];
		}
	}
}

async function unbundle(handler: TransitionHandler, spark: any, args: string[]) {
	const jspmFile = getJspmConfigFile();
	const configs = loadSystemjsConfigFileMultiParts(jspmFile);
	const filesToRemove = [];
	
	for (const name of args) {
		const [registry, base] = splitName(name);
		spark.write(`unbundle ${base}:\n`);
		
		filesToRemove.push(
			getBundleLocation(base),
			getBundleTempLocation(base),
		);
		
		removeFromBundle(configs, base);
	}
	
	await saveSystemjsConfigFileMultiParts(jspmFile, configs);
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
	
	setTimeout(async () => {
		for (const file of filesToRemove) {
			try {
				if (await fileExists(file)) {
					await unlink(file);
				}
			} catch (e) {
			}
		}
	});
}
