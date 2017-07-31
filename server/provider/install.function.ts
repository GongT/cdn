import {pathExistsSync, readFile} from "fs-extra";
import {fileExistsSync} from "../library/file-exists";
import {getBundleLocation, getBundleTempLocation} from "../library/files";
import {mergeInstalledPackage} from "../library/local-package-list";
import {generateJspmConfig} from "../route/jspm.config";
import {createOpList} from "./cleanup.function";
import {createDepCache} from "./jspm-functions";
import {removeFile, splitName, TransitionHandler} from "./socket-handler";

export async function jspmBundleCache(name: string, opList: string[], handler: TransitionHandler) {
	const [registry, base] = splitName(name);
	
	let packageIndex = base;
	await handler.create([
		'normalize',
		base,
	], true);
	const path = handler.lastOutput.trim().replace(/^file:\/\//, '');
	if (pathExistsSync(path) && fileExistsSync(path + '.json')) {
		const pkg = JSON.parse(await readFile(path + '.json', {encoding: 'utf8'}));
		if (!pkg.main) {
			packageIndex = `[${base}/**/*.js]`;
		}
	}
	
	await handler.create([
		'bundle',
		'-y',
		// '--skip-rollup',
		'--minify',
		'--inject',
		// '--no-mangle',
		//'--format', 'cjs',
		'--source-map-contents',
		packageIndex,
		...opList,
		`${getBundleLocation(base)}`,
	]);
}

export async function handleInstallOnly(handler: TransitionHandler, spark: any, args: string[]) {
	await handler.create(['install', '-y', ...args]);
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}

export async function handleInstall(handler: TransitionHandler, spark: any, args: string[]) {
	let success: boolean;
	success = await handler.create(['install', '-y', ...args]);
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
	
	await createDepCache(handler, spark);
	
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}
