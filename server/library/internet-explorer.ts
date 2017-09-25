import {createLogger} from "@gongt/ts-stl-library/log/debug";
import {LOG_LEVEL} from "@gongt/ts-stl-library/log/levels";
import {ExpressAppBuilder} from "@gongt/ts-stl-server/boot/express-app-builder";
import {STL_SERVER_PACKAGE_ROOT} from "@gongt/ts-stl-server/STL_SERVER_PACKAGE_ROOT";
import {transformFile, TransformOptions} from "babel-core";
import {Handler, Request, Response} from "express-serve-static-core"
import {copy, ensureDir, readFile, writeFile} from "fs-extra";
import {dirname, resolve} from "path";
import * as serveStataic from "serve-static";
import {fileExists} from "./file-exists";
import {getBundleFolder, getStorageBaseFolder, getTempFolder} from "./files";

const ieStorageFolder = resolve(getTempFolder(), 'ie-storage');
const storageSourceFolder = getStorageBaseFolder();
const ieBundleFolder = resolve(getTempFolder(), 'ie-bundle');
const bundleSourceFolder = getBundleFolder();

export function handleInternetExplorer(builder: ExpressAppBuilder) {
	const processor1 = createProcessor(storageSourceFolder, ieStorageFolder);
	builder.prependMiddleware('/ie-storage', ...processor1);
	
	const processor2 = createProcessor(bundleSourceFolder, ieBundleFolder);
	builder.prependMiddleware('/load-ie-bundles', ...processor2);
}

function createProcessor(sourceFolder, targetFolder): Handler[] {
	return [
		serveStataic(targetFolder, {
			fallthrough: true,
			redirect: false,
		}),
		nodify((req: Request, res: Response) => {
			return createIeSource(req, res, sourceFolder, targetFolder);
		}),
		serveStataic(targetFolder, {
			fallthrough: false,
			redirect: false,
		}),
	];
}

const debug = createLogger(LOG_LEVEL.DEBUG, 'IE');

async function createIeSource(req, res, sourceFolder, targetFolder) {
	const rel = req.url.replace(/^\//, '');
	const source = resolve(sourceFolder, rel);
	const target = resolve(targetFolder, rel);
	await ensureDir(dirname(target));
	if (/.js$/.test(source)) {
		debug('transpile: %s -> %s', source, target);
		
		const source_map = source + '.map';
		let sourceMap: object;
		if (await fileExists(source_map)) {
			sourceMap = JSON.parse(await readFile(source_map, {encoding: 'utf8'}));
		}
		
		const {code, map} = await new Promise<any>((resolve, reject) => {
			const opt: TransformOptions = {
				ast: false,
				code: true,
				sourceMaps: true,
				comments: true,
				babelrc: true,
				"extends": STL_SERVER_PACKAGE_ROOT + '/.babelrc',
				inputSourceMap: sourceMap,
				minified: false,
				only: source,
			};
			transformFile(source, opt, (err, data) => {
				err? reject(err) : resolve(data);
			});
		});
		await writeFile(target, code, {encoding: 'utf8'});
		await writeFile(target + '.map', JSON.stringify(map), {encoding: 'utf8'});
	} else {
		await copy(source, target);
	}
}

type PromiseHandler = (req: Request, res: Response) => Promise<void>;

function nodify(fn: PromiseHandler): Handler {
	return (req, res, next) => {
		fn(req, res).then(() => next()).catch(e => next(e));
	};
}

function promisify(middleware: Handler): PromiseHandler {
	return (req, res) => {
		return new Promise((resolve, reject) => {
			const wrappedCallback = (err) => err? resolve(err) : resolve();
			middleware(req, res, wrappedCallback);
		});
	};
}
