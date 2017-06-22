import {loadSystemjsConfigFile} from "@gongt/ts-stl-server/express/render/jspm";
import {Application} from "express-serve-static-core";
import {getJspmConfigFile} from "../library/files";

export function mountLoader(app: Application) {
	const file = getJspmConfigFile();
	const domain = '://' + process.env.PROJECT_NAME + '.' + JsonEnv.baseDomainName.replace(/^\./, '') + '/';
	
	let config = loadSystemjsConfigFile(file);
	delete config.nodeConfig;
	delete config.devConfig;
	delete config.browserConfig.paths;
	
	config.paths = {
		'jspm-cdn': domain + 'storage',
	};
	
	let text = JSON.stringify(config, null, 2);
	text = text.replace(/"npm:/g, '"jspm-cdn:');
	
	config = JSON.parse(text); // confirm
	
	const fileContent = `
`; // TODO
	
	app.get('/jspm.config.js', (req, res, next) => {
		res.header('Content-Type', 'text/javascript; charset=utf8');
		
		res.send()
	});
}
