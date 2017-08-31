import {loadSystemjsConfigFile} from "@gongt/ts-stl-server/express/render/jspm";
import {getBundleFileName, getBundleLocation, getBundleTempLocation, getJspmConfigFile} from "../library/files";
import {installedPackageNames, mergeInstalledPackage} from "../library/local-package-list";
import {packageHasMainIndex, resolvePackageCmdItem} from "../library/package-name";
import {generateJspmConfig} from "../route/jspm.config";
import {removeFile, splitName, TransitionHandler} from "./socket-handler";

export async function jspmBundleCache(name: string, handler: TransitionHandler, spark: any, production: boolean) {
	const [registry, base] = splitName(name);
	const packageIndex = await resolvePackageCmdItem(name, handler);
	const target = getBundleLocation(base);
	const targetRel = getBundleFileName(base);
	
	const args = [
		'--inject',
		'--source-map-contents',
	];
	if (production) {
		args.push('--no-mangle');
	} else {
		args.push('--dev');
	}
	
	// const opList = await createOpList(name, handler);
	
	await handler.create([
		'--log', 'warn',
		'bundle',
		...args,
		packageIndex,
		`${target}`,
	]);
	
	const files = findBundle(targetRel);
	if (!files) {
		spark.write('\x1B[38;5;9mError: seems not success, bundle result file does not exists.\x1B[0m\n');
		return;
	}
	spark.write('bundle success: ' + files.length + ' file includes.\n');
	const reg: any = {};
	for (const path of files) {
		const l = /^[^\/]+?:@/.test(path)? 2 : 1;
		const pkg = path.split('/', l).slice(0, l).join('/').replace(/\.json$/, '');
		reg[pkg] = true;
	}
	
	const opList = [];
	const installed = installedPackageNames();
	for (const item of Object.keys(reg)) {
		const [_, b] = splitName(item);
		if (b === base || installed.indexOf(b) === -1) {
			continue;
		}
		if (await packageHasMainIndex(item, handler)) {
			opList.push('-', `${item}`);
		} else {
			opList.push('-', `[${item}*]`);
		}
		opList.push('-', `[${item}/**/*]`);
	}
	
	await handler.create([
		'bundle',
		...args,
		packageIndex,
		...opList,
		`${target}`,
	]);
}

function findBundle(path: string): string {
	const data = loadSystemjsConfigFile(getJspmConfigFile());
	if (data.browserConfig && data.browserConfig.bundles && data.browserConfig.bundles[path]) {
		return data.browserConfig.bundles[path];
	}
	if (data.bundles && data.bundles[path]) {
		return data.bundles[path];
	}
	return null;
}

export async function handleInstallOnly(handler: TransitionHandler, spark: any, args: string[]) {
	await handler.create(['install', ...args]);
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}

export async function handleInstall(handler: TransitionHandler, spark: any, args: string[]) {
	let success: boolean;
	success = await handler.create(['install', ...args]);
	if (!success) {
		return;
	}
	
	mergeInstalledPackage(args);
	
	args = args.filter((n, i) => {
		return args.indexOf(n) === i;
	});
	
	for (let name of args) {
		await jspmBundleCache(name, handler, spark, true);
		
		const [registry, base] = splitName(name);
		
		await removeFile(spark, getBundleTempLocation(base));
	}
	
	// await createDepCache(handler, spark);
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}
