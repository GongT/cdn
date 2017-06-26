import {generateJspmConfig} from "../route/jspm.config";
import {TransitionHandler} from "./socket-handler";

export async function handleUpdateJspmConfigCache(handler: TransitionHandler, spark: any, fn: string) {
	spark.write(`update jspm.config.js cache content\n`);
	generateJspmConfig();
}
