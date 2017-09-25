import {loadSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm";
import {saveSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm.write";
import {unlink} from "fs-extra";
import {fileExists} from "../library/file-exists";
import {getBundleLocation, getBundleTempLocation, getJspmConfigFile} from "../library/files";
import {installedPackageNames, installedPackages} from "../library/local-package-list";
import {resolvePackageCmdItem} from "../library/package-name";
import {updateJspmConfig} from "../route/jspm.config";
import {removeFromBundle} from "./bundle.function";
import {TransitionHandler} from "./socket-handler";

export async function handleBuildCreate(handler: TransitionHandler, spark: any, production: boolean) {
	const list = installedPackageNames();
	spark.write(`bundles all:\n ::  ${list.join('\n ::  ')}\n`);
	const target = getBundleLocation('everything');
	
	const args = [
		'--inject',
		'--source-map-contents',
	];
	if (production) {
		args.push('--no-mangle');
	} else {
		args.push('--dev');
	}
	
	const indexPackage = [];
	for (const name of installedPackages()) {
		const packageIndex = await resolvePackageCmdItem(name, handler);
		indexPackage.push('+', packageIndex);
	}
	indexPackage.shift();
	
	await handler.create([
		'--log', 'warn',
		'bundle',
		...args,
		...indexPackage,
		`${target}`,
	]);
	
	spark.write(`update jspm.config.js cache content\n`);
	updateJspmConfig();
}

export async function handleBuildDelete(handler: TransitionHandler, spark: any) {
	await unbundle(handler, spark);
}

async function unbundle(handler: TransitionHandler, spark: any) {
	const jspmFile = getJspmConfigFile();
	const configs = loadSystemjsConfigFileMultiParts(jspmFile);
	
	spark.write(`unbuild:\n`);
	
	removeFromBundle(configs, 'everything');
	
	await saveSystemjsConfigFileMultiParts(jspmFile, configs);
	spark.write(`update jspm.config.js cache content\n`);
	updateJspmConfig();
	
	setTimeout(async () => {
		const filesToRemove = [
			getBundleLocation('everything'),
			getBundleTempLocation('everything'),
		];
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
