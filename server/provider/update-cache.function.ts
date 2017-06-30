import {generateJspmConfig} from "../route/jspm.config";
import {createDepCache} from "./jspm-functions";
import {TransitionHandler} from "./socket-handler";

export async function handleUpdateJspmConfigCache(handler: TransitionHandler, spark: any) {
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}

export async function handleUpdateJspmDepCache(handler: TransitionHandler, spark: any) {
	await createDepCache(handler, spark);
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}
