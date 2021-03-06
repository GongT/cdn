import {SystemjsConfigFile} from "@gongt/ts-stl-client/jspm/defines";
import {loadSystemjsConfigFile, loadSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm";
import {saveSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm.write";
import {getBundleFileName, getBundleLocation, getBundleTempLocation, getJspmConfigFile} from "../library/files";
import {removeInstalledPackage} from "../library/local-package-list";
import {updateJspmConfig} from "../route/jspm.config";
import {removeFile, splitName, TransitionHandler} from "./socket-handler";

export function findFullFormat(packageBase: string) {
	const config = loadSystemjsConfigFile(getJspmConfigFile());
	if (config.map &&
	    config.map[packageBase] &&
	    (typeof config.map[packageBase] === 'string')
	) {
		return <string>config.map[packageBase];
	}
	if (config.browserConfig &&
	    config.browserConfig.map &&
	    config.browserConfig.map[packageBase] &&
	    (typeof config.browserConfig.map[packageBase] === 'string')
	) {
		return <string>config.browserConfig.map[packageBase];
	}
}

function removeBundles(spark: any, configs: SystemjsConfigFile[], packageBase: string) {
	const bundleFile = getBundleFileName(packageBase);
	configs.forEach((config) => {
		if (config.bundles && config.bundles[bundleFile]) {
			spark.write(`remove bundle: ${bundleFile}\n`);
			delete config.bundles[bundleFile];
		}
		if (config.browserConfig && config.browserConfig.bundles && config.browserConfig.bundles[bundleFile]) {
			spark.write(`remove bundle: ${bundleFile}\n`);
			delete config.browserConfig.bundles[bundleFile];
		}
	});
}

export async function handleUninstall(handler: TransitionHandler, spark: any, args: string[]) {
	let success: boolean;
	const bases = args.map((name) => {
		const [_, base] = splitName(name);
		return base;
	});
	const configs = loadSystemjsConfigFileMultiParts(getJspmConfigFile());
	
	success = await handler.create(['uninstall', ...bases]);
	if (!success) {
		throw new Error('unable to uninstall.');
	}
	removeInstalledPackage(args);
	
	for (let base of bases) {
		removeBundles(spark, configs, base);
		
		await removeFile(spark, getBundleLocation(base));
		await removeFile(spark, getBundleLocation(base) + '.map');
		await removeFile(spark, getBundleTempLocation(base));
	}
	
	spark.write(`save jspm.config.js real content\n`);
	await saveSystemjsConfigFileMultiParts(getJspmConfigFile(), configs);
	
	// await createDepCache(handler, spark);
	
	spark.write(`update jspm.config.js cache content\n`);
	updateJspmConfig();
	
	await handler.create(['clean']);
}
