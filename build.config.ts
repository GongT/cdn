import {MicroBuildHelper} from "./.micro-build/x/microbuild-helper";
import {MicroBuildConfig, ELabelNames, EPlugins} from "./.micro-build/x/microbuild-config";
import {JsonEnv} from "./.jsonenv/_current_result";
declare const build: MicroBuildConfig;
declare const helper: MicroBuildHelper;
/*
 +==================================+
 | <**DON'T EDIT ABOVE THIS LINE**> |
 | THIS IS A PLAIN JAVASCRIPT FILE  |
 |   NOT A TYPESCRIPT OR ES6 FILE   |
 |    ES6 FEATURES NOT AVAILABLE    |
 +==================================+
 */

/* Example config file */

const projectName = 'jspm';

build.baseImage('node', 'alpine');
build.projectName(projectName);
build.domainName(projectName + '.' + JsonEnv.baseDomainName);

build.forceLocalDns(true);
build.isInChina(JsonEnv.gfw.isInChina, JsonEnv.gfw);
build.npmCacheLayer(JsonEnv.gfw.npmRegistry);
build.systemInstall('git');
build.npmInstall('./package.json', ['make', 'g++', 'python']);

build.forwardPort(80, 'tcp');
build.listenPort(3323);

build.environmentVariable('MAIN_FILE', './dist/index.js');
build.startupCommand('./node_modules/.bin/ts-app-loader');
build.shellCommand('node');

build.addPlugin(EPlugins.jenv);

build.addPlugin(EPlugins.typescript, {
	source: 'server',
	target: 'dist',
});
build.addPlugin(EPlugins.typescript, {
	source: 'client',
	target: 'dist/client-code',
});
build.addPlugin(EPlugins.typescript, {
	source: 'server/simple-package',
	target: 'dist/simple-package',
});
build.addPlugin(EPlugins.jspm_bundle, {
	build: false,
	source: './dist/client-code/index.js',
	packageJson: './package.json',
	externals: ['@gongt/ts-stl-library', '@gongt/ts-stl-client'],
});

build.onConfig(() => {
	const file = helper.createTextFile('export const PROJECT_NAME:string = ' + JSON.stringify(projectName));
	file.save('server/simple-package/global.ts');
	
	const fs = require('fs');
	['package.json'].forEach((file) => {
		const d = fs.readFileSync(`${__dirname}/server/simple-package/${file}`, 'utf8');
		const f = helper.createTextFile(d);
		f.save(`${__dirname}/dist/simple-package/${file}`);
	});
});

build.volume('./source-storage', '/data/source-storage');
