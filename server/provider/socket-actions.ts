import {handleCleanup} from "./cleanup.function";
import {handleCommand} from "./command.function";
import {handleConfigInit} from "./config-init.function";
import {handleInstall} from "./install.function";
import {handleResize} from "./resize.action";
import {requireLock, TransitionHandler} from "./socket-handler";
import {handleUninstall} from "./uninstall.function";
import {handleUpdateJspmConfigCache, handleUpdateJspmDepCache} from "./update-cache.function";

export async function handleControlAction(lockId: string, handler: TransitionHandler, spark: any, payload: any) {
	switch (payload.action) {
	case 'resize':
		return handleResize(handler, spark, payload.data);
	case 'end':
		return handler.finishInput();
	case 'kill':
		return handler.kill(payload.data);
	case 'command':
		requireLock(lockId, spark);
		return handleCommand(handler, spark, payload.data);
	case 'function':
		if (Array.isArray(payload.data)) {
			const [func, ...args] = payload.data;
			return handleFunction(lockId, handler, spark, func, args.filter(e => !!e));
		} else {
			throw new Error(`unknown data: ${payload.data}`);
		}
	default:
		throw new Error(`unknown action: ${payload.action}`);
	}
}

async function handleFunction(lockId: string, handler: TransitionHandler, spark: any, fn: string, args: string[]) {
	switch (fn) {
	case 'install_inject':
		requireLock(lockId, spark);
		return handleInstall(handler, spark, args);
	case 'uninstall':
		requireLock(lockId, spark);
		return handleUninstall(handler, spark, args);
	case 'config_init':
		return handleConfigInit(handler, spark, args);
	case 'update_cache':
		return handleUpdateJspmConfigCache(handler, spark);
	case 'update_dep_cache':
		return handleUpdateJspmDepCache(handler, spark);
	case 'cleanup_bundles':
		return handleCleanup(handler, spark, args);
	}
}
