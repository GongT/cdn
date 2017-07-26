import {HTTP} from "@gongt/ts-stl-library/request/request";
import {loadSystemjsConfigFile} from "@gongt/ts-stl-server/express/render/jspm";
import {Router} from "express";
import {Application} from "express-serve-static-core";
import {mkdirp, readFile, writeFile} from "fs-extra";
import {dirname} from "path";
import * as serveStataic from "serve-static";
import {fileExists} from "../library/file-exists";
import {getBundleLocation, getBundleTempLocation, getJspmConfigFile, getTempFolder} from "../library/files";
import {getBaseUrl} from "../simple-package/get-base";

const s = (data: any) => {
	return JSON.stringify(data);
};
let fileContent: string;

export function mountLoader(app: Application) {
	generateJspmConfig();
	
	app.get('/jspm.config.js', (req, res, next) => {
		res.header('Content-Type', 'text/javascript; charset=utf8');
		
		res.send(fileContent);
	});
	
	const router = Router();
	app.use('/load-bundles', router);
	router.get(['/:file', '/:scope/:package'], serveStataic(getTempFolder()), async function (req, res, next) {
		let name;
		if (req.params.scope && req.params.package) {
			name = req.params.scope + '/' + req.params.package.replace(/\.js$/, '');
		} else if (req.params.file) {
			name = req.params.file.replace(/\.js$/, '');
		} else {
			return res.status(HTTP.BAD_REQUEST).send('');
		}
		const file = getBundleLocation(name);
		const temp = getBundleTempLocation(name);
		if (!fileExists(file)) {
			return res.status(HTTP.NOT_FOUND).send(`<h1>404 Not Found</h1><pre>${file}</pre>`);
		}
		
		try {
			await mkdirp(dirname(temp));
			
			let data = await readFile(file, {encoding: 'utf8'});
			
			data = data.replace(/System.registerDynamic\("npm:/g, 'System.registerDynamic("jspmcdn-npm:');
			data = data.replace(/System.registerDynamic\("github:/g, 'System.registerDynamic("jspmcdn-github:');
			data = data.replace(/System.registerDynamic\("jspm:/g, 'System.registerDynamic("jspmcdn-jspm:');
			
			await writeFile(temp, data, {encoding: 'utf8'});
			next();
		} catch (e) {
			return res.status(HTTP.INTERNAL_SERVER_ERROR).send(e);
		}
	}, serveStataic(getTempFolder()));
}

export function generateJspmConfig() {
	const file = getJspmConfigFile();
	const rootUrl = getBaseUrl();
	
	let config = loadSystemjsConfigFile(file);
	
	delete config.paths;
	if (config.browserConfig) {
		delete config.browserConfig.paths;
	}
	if (config.packages) {
		delete config.packages['jspm-cdn'];
	}
	
	delete config.nodeConfig;
	delete config.devConfig;
	
	let text = JSON.stringify(config, null, 2);
	text = text.replace(/"npm:/g, '"jspmcdn-npm:');
	text = text.replace(/"github:/g, '"jspmcdn-github:');
	text = text.replace(/"jspm:/g, '"jspmcdn-jspm:');
	
	config = JSON.parse(text); // confirm
	
	// lang=javascript
	fileContent = `/* generated file */
(function (System, Local, configData) {
	if(!Array.prototype.forEach){
		alert('your browser is too old.');
		throw new Error('IE < 9');
	}
	var domain = ${s(rootUrl)};
	if (/^\\/\\//.test(domain)) {
		domain = location.protocol + domain;
	}
	if (!/\\/$/.test(domain)) {
		domain += '/';
	}
	var storageUrl = domain + 'storage/';
	
	if(configData.browserConfig) {
		configData.browserConfig.baseURL = storageUrl;
	} else {
		configData.baseURL = storageUrl;
	}
	
	function http2support(){ /// detect HTTP2 support by browser version
		if(!/^https/.test(domain)) return false;
		
		var isChrome = !!window.chrome && !!window.chrome.webstore;
		if(isChrome) return true;
		
		var isFirefox = typeof InstallTrigger !== 'undefined';
		if(isFirefox) return true;
		
		var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
		if (isSafari) {
			var isSafariWin = /windows/i.test(navigator.userAgent);
			if(isSafariWin) return false;
			var isSafariIos = /ipad|iphone/i.test(navigator.userAgent);
			if(isSafariIos) return true;
			var mmac = /mac os x (\\d+)[_.](\\d+)/i.exec(navigator.userAgent)
			if(!mmac) return false;
			var isMacOsGt_10_11 = mmac[1] > 10 || (mmac[1] == 10 && mmac[2]>=11);
			if(isMacOsGt_10_11) return true;
			return false;
		}
		
		var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		var isBlink = (isChrome || isOpera) && !!window.CSS;
		if(isBlink) return true;
		
		var isEdge = /Edge\\/\\d+/.test(navigator.userAgent);
		if(isEdge) return true;
		
		var isIE = /*@cc_on!@*/false || !!document.documentMode;
		if(isIE) {
			var isIE11 = /rv:11/.test(navigator.userAgent);
			var isWin10 = /Windows NT 10/i.test(navigator.userAgent);
			if(isIE11 && isWin10) return true;
			return false;
		}
		
		return false;
	}
	
	function wrapBundles(bundles) {
		if (!bundles) {
			return {};
		}
		
		// if(http2support()) {
		// 	return {}; // no bundle with http2
		// }
		
		var ret = {}, bundleList = [];
		Object.keys(bundles).forEach((name) => {
			bundleList.push({
				length: bundles[name].length,
				list: bundles[name],
				name: domain + 'load-' + name
			});
		});
		bundleList.sort(function (configA, configB){
			return configA.length - configB.length;
		}).forEach(function (config){
			ret[config.name] = config.list;
		});
		return ret;
	}
	
	configData.paths = {
		'jspmcdn-npm:': storageUrl + 'jspm_packages/npm/',
		'jspmcdn-github:': storageUrl + 'jspm_packages/github/',
		'jspmcdn-jspm:': storageUrl + 'jspm_packages/jspm/',
	};
	
	Local.config(configData);
	
	System.config({
		packages: Local.packages,
		paths: Local.paths,
		bundles: wrapBundles(Local.bundles),
		depCache: Local.depCache,
		map: Local.map,
		meta: Local.meta,
		packageConfigPaths: Local.packageConfigPaths,
	});
	
	window.__debug_Local = Local;
})(SystemJS, new System.constructor(), ${s(config)})`;
}
