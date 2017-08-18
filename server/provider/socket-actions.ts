import {installedPackages} from "../library/local-package-list";
import {handleBuildCreate, handleBuildDelete} from "./build.function";
import {handleBundleCreate, handleBundleDelete} from "./bundle.function";
import {handleCommand} from "./command.function";
import {handleConfigInit} from "./config-init.function";
import {handleDisplayAll} from "./display-all.function";
import {handleInstall, handleInstallOnly} from "./install.function";
import {handleResize} from "./resize.action";
import {requireLock, TransitionHandler} from "./socket-handler";
import {handleUninstall} from "./uninstall.function";
import {handleRemoveJspmDepCache, handleUpdateJspmConfigCache, handleUpdateJspmDepCache} from "./update-cache.function";

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
			const [func, args] = payload.data;
			return handleFunction(lockId, handler, spark, func, args.split(/\s+/).filter(e => !!e));
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
	case 'install_everything':
		requireLock(lockId, spark);
		return handleInstallOnly(handler, spark, installedPackages());
	case 'uninstall':
		requireLock(lockId, spark);
		return handleUninstall(handler, spark, args);
	case 'config_init':
		return handleConfigInit(handler, spark, args);
	case 'update_cache':
		return handleUpdateJspmConfigCache(handler, spark);
	case 'update_dep_cache':
		requireLock(lockId, spark);
		return handleUpdateJspmDepCache(handler, spark);
	case 'remove_dep_cache':
		requireLock(lockId, spark);
		return handleRemoveJspmDepCache(handler, spark);
	case 'create_bundles_minify':
		requireLock(lockId, spark);
		return handleBundleCreate(handler, spark, args, true);
	case 'create_bundles':
		requireLock(lockId, spark);
		return handleBundleCreate(handler, spark, args, false);
	case 'delete_bundles':
		requireLock(lockId, spark);
		return handleBundleDelete(handler, spark, args);
	case 'create_build_minify':
		requireLock(lockId, spark);
		return handleBuildCreate(handler, spark, true);
	case 'create_build':
		requireLock(lockId, spark);
		return handleBuildCreate(handler, spark, false);
	case 'delete_build':
		requireLock(lockId, spark);
		return handleBuildDelete(handler, spark);
	case 'installed_show':
		return handleDisplayAll(handler, spark);
	}
}



