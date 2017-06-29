import {provideWithExpress} from "@gongt/ts-stl-server/express/middlewares/well-known-provider";
import {JspmPackagePlugin} from "@gongt/ts-stl-server/express/render/jspm";
import {Application} from "express-serve-static-core";
import {resolve} from "path";
import {fileExists} from "../library/file-exists";
import {getPackageConfigFile} from "../library/files";
import {copySync} from "fs-extra";

export const jspm = new JspmPackagePlugin({
	packageName: 'client',
});

export function initJspmConfig(app: Application) {
	// jspm package init
	const config = jspm.jspmConfig();
	config.registerExtension('css');
	jspm.clientCodeLocation(
		resolve(__dirname, '../../dist/client-code'),
		resolve(__dirname, '../../client'),
	);
	provideWithExpress(app, jspm);
	
}
