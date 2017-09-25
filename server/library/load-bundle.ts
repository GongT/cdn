import {HTTP} from "@gongt/ts-stl-library/request/request";
import {mkdirp, readFile, writeFile} from "fs-extra";
import {dirname} from "path";
import {fileExists} from "../library/file-exists";
import {
	getBundleLocation,
	getBundleMapLocation,
	getBundleMapTempLocation,
	getBundleTempLocation,
} from "../library/files";

export async function bundleFileSourceProcessor(req, res, next) {
	let name;
	if (req.params.scope && req.params.package) {
		name = req.params.scope + '/' + req.params.package.replace(/\.js$/, '');
	} else if (req.params.file) {
		name = req.params.file.replace(/\.js$/, '');
	} else {
		return res.status(HTTP.BAD_REQUEST).send('');
	}
	if (/\.map$/.test(name)) {
		const file = getBundleMapLocation(name);
		const temp = getBundleMapTempLocation(name);
		if (!fileExists(file)) {
			return res.status(HTTP.NOT_FOUND).send(`<h1>404 Not Found</h1><pre>${file}</pre>`);
		}
		try {
			await mkdirp(dirname(temp));
			let data = await readFile(file, {encoding: 'utf8'});
			await writeFile(temp, data, {encoding: 'utf8'});
			return next();
		} catch (e) {
			return res.status(HTTP.INTERNAL_SERVER_ERROR).send(e);
		}
	} else {
		const file = getBundleLocation(name);
		const temp = getBundleTempLocation(name);
		if (!fileExists(file)) {
			return res.status(HTTP.NOT_FOUND).send(`<h1>404 Not Found</h1><pre>${file}</pre>`);
		}
		
		try {
			await mkdirp(dirname(temp));
			
			let data = await readFile(file, {encoding: 'utf8'});
			
			// data = data.replace(/System.registerDynamic\("npm:/g, 'System.registerDynamic("jspmcdn-npm:');
			// data = data.replace(/System.registerDynamic\("github:/g, 'System.registerDynamic("jspmcdn-github:');
			// data = data.replace(/System.registerDynamic\("jspm:/g, 'System.registerDynamic("jspmcdn-jspm:');
			
			await writeFile(temp, data, {encoding: 'utf8'});
			next();
		} catch (e) {
			return res.status(HTTP.INTERNAL_SERVER_ERROR).send(e);
		}
	}
}
