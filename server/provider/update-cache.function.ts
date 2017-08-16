import {loadSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm";
import {saveSystemjsConfigFileMultiParts} from "@gongt/ts-stl-server/express/render/jspm.write";
import {getJspmConfigFile} from "../library/files";
import {generateJspmConfig} from "../route/jspm.config";
import {createDepCache} from "./jspm-functions";
import {TransitionHandler} from "./socket-handler";

export async function handleUpdateJspmConfigCache(handler: TransitionHandler, spark: any) {
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}

export async function handleRemoveJspmDepCache(handler: TransitionHandler, spark: any) {
	spark.write(`remove dependencies cache\n`);
	const file = getJspmConfigFile();
	let config = loadSystemjsConfigFileMultiParts(file);
	config.forEach((item) => {
		delete item.depCache;
		if (item.browserConfig) {
			delete item.browserConfig.depCache;
		}
	});
	await saveSystemjsConfigFileMultiParts(file, config);
	
	await handleUpdateJspmConfigCache(handler, spark);
}

export async function handleUpdateJspmDepCache(handler: TransitionHandler, spark: any) {
	await createDepCache(handler, spark);
	await handleUpdateJspmConfigCache(handler, spark);
}
