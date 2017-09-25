import {ExpressAppBuilder} from "@gongt/ts-stl-server/boot/express-app-builder";
import {loadSystemjsConfigFile} from "@gongt/ts-stl-server/express/render/jspm";
import {getBundleFolder, getJspmConfigFile, getStorageBaseFolder,} from "../library/files";
import {handleInternetExplorer} from "../library/internet-explorer";

const s = (data: any) => {
	return JSON.stringify(data);
};

let jspmConfigTemplate: TemplateFunction;

export function mountLoader(builder: ExpressAppBuilder) {
	updateJspmConfig();
	
	builder.prependMiddleware('/jspm.config.js', (req, res, next) => {
		res.header('Content-Type', 'text/javascript; charset=utf8');
		res.send(jspmConfigTemplate(s(req.hostname)));
	});
	
	const storageOpt = {
		fallthrough: false,
		redirect: false,
	};
	builder.mountPublic('/storage/', getStorageBaseFolder(), storageOpt);
	
	builder.mountPublic('/load-bundles', getBundleFolder(), {
		fallthrough: false,
		redirect: false,
	});
	
	handleInternetExplorer(builder);
}

type TemplateFunction = (rootUrl: string) => string;

function createReplacer(): TemplateFunction {
	// TODO: replace with stl
	const APP_RUN_PORT: number = (process.env.RUN_IN_DOCKER)
		? null
		: parseInt(process.env.LISTEN_PORT) || 80;
	const file = getJspmConfigFile();
	
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
	config = JSON.parse(text); // confirm
	
	// lang=javascript
	let fileContent = `/* generated file */
(function (System, Local, configData) {
	if(!Array.prototype.forEach){
		alert('your browser is too old.');
		throw new Error('IE < 9');
	}
	var domain = CLIENT_BASE_URL_REPLACE;
	if (!/https?:\\/\\//i.test(domain) && !/^\\/\\//.test(domain)){
		domain = '//' + domain;
	}
	if (/^\\/\\//.test(domain)) {
		domain = location.protocol + domain;
	}
	if (!/\\/$/.test(domain)) {
		if(!/^https:\\/\\//.test(domain)) {
			domain += '${APP_RUN_PORT? `:${APP_RUN_PORT}` : ''}/';
		} else {
			domain += '/';
		}
	}
	
	var storageFolder = 'storage/';
	var loadBundle = 'load-';
	var isIE = /*@cc_on!@*/false || !!document.documentMode;
	if (isIE) {
		storageFolder = 'ie-storage/';
		loadBundle = 'load-ie-';
	}
	var storageUrl = domain + storageFolder;
	
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
		Object.keys(bundles).forEach(function (name) {
			bundleList.push({
				length: bundles[name].length,
				list: bundles[name],
				name: domain + loadBundle + name
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
		'npm:': storageUrl + 'jspm_packages/npm/',
		'github:': storageUrl + 'jspm_packages/github/',
		'jspm:': storageUrl + 'jspm_packages/jspm/',
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
	
	fileContent = s(fileContent);
	return (void 0 || eval)("(rootUrl) => " + fileContent.replace('CLIENT_BASE_URL_REPLACE', '" + rootUrl + "'));
}

export function updateJspmConfig() {
	jspmConfigTemplate = createReplacer();
}
