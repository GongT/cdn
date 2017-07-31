import {writeFile} from "fs-extra";
import {resolve} from "path";
import {getStorageBaseFolder} from "../library/files";
import {installedPackages} from "../library/local-package-list";
import {packageHasMainIndex} from "../library/package-name";
import {splitName, TransitionHandler} from "./socket-handler";

export async function createDepCache(handler: TransitionHandler, spark: any,) {
	let loadAllDeps = '';
	for (const name of installedPackages()) {
		const [registry, base] = splitName(name);
		if (await packageHasMainIndex(name, handler)) {
			loadAllDeps += `import ${JSON.stringify(base)}\n`;
		}
	}
	
	spark.write(`create dep-cache\n`);
	const tokenFile = resolve(getStorageBaseFolder(), 'try-load-all-libs.js');
	await writeFile(tokenFile, loadAllDeps, {encoding: 'utf8'});
	
	spark.write(`\x1B[0;38;5;239m--------------\n${loadAllDeps}--------------\n\x1B[0m`)
	
	await handler.create([
		'depcache',
		tokenFile,
	]);
}
