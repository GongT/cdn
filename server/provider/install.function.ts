import {getBundleLocation, getBundleTempLocation} from "../library/files";
import {mergeInstalledPackage} from "../library/local-package-list";
import {resolvePackageCmdItem} from "../library/package-name";
import {generateJspmConfig} from "../route/jspm.config";
import {createOpList} from "./cleanup.function";
import {removeFile, splitName, TransitionHandler} from "./socket-handler";

export async function jspmBundleCache(name: string, opList: string[], handler: TransitionHandler) {
	const [registry, base] = splitName(name);
	const packageIndex = await resolvePackageCmdItem(name, handler);
	
	const args = [
		'--inject',
		'--source-map-contents',
		'--no-mangle',
		// '--skip-rollup',
	];
	if (JsonEnv.isDebug) {
		args.push('--dev');
	}
	
	await handler.create([
		'bundle',
		...args,
		packageIndex,
		...opList,
		`${getBundleLocation(base)}`,
	]);
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
	
	const argsOpList = args.map((name, index) => {
		const extraOpList: string[] = createOpList(name)
			.concat(
				...args.filter((n, i) => i !== index).map((n) => ['-', n]),
			);
		return {
			name,
			opList: extraOpList,
		};
	});
	for (let {name, opList} of argsOpList) {
		await jspmBundleCache(name, opList, handler);
		
		const [registry, base] = splitName(name);
		
		await removeFile(spark, getBundleTempLocation(base));
	}
	
	// await createDepCache(handler, spark);
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}
