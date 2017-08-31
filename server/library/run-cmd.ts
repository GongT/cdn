import {createLogger} from "@gongt/ts-stl-library/log/debug";
import {LOG_LEVEL} from "@gongt/ts-stl-library/log/levels";
import {HTTP} from "@gongt/ts-stl-library/request/request";
import {DownloadRequestContext} from "@gongt/ts-stl-server/express/raw-handler";
import {ChildProcessResult, spawn} from "child-process-promise";
import {ChildProcess, spawn as spawnNative, spawnSync} from "child_process";
import {getStorageBaseFolder} from "./files";

const jspm = require.resolve('jspm').replace(/api\.js$/, 'jspm.js');
if (!jspm) {
	throw new Error('no jspm found.');
}

export function initRunJspm(...cmds: string[]) {
	const p = spawnSync(jspm, cmds, {
		encoding: 'utf8',
		cwd: getStorageBaseFolder(),
		stdio: ['ignore', 'inherit', 'inherit'],
	});
	if (p.error) {
		throw p.error;
	}
	if (p.status !== 0) {
		throw new Error(`jspm init install exit with ${p.status}.`);
	}
	if (p.signal) {
		throw new Error(`jspm init killed with ${p.signal}.`);
	}
}

export function runJspm(...argument: string[]): Promise<{output: string}&ChildProcessResult<null>> {
	const ret = spawn(jspm, argument, {
		cwd: getStorageBaseFolder(),
		stdio: ['inherit', 'pipe', 'pipe'],
		env: process.env,
	});
	
	let output = '';
	
	ret.progress((child) => {
		child.stderr.on('data', function (data) {
			output += data;
		});
		child.stdout.on('data', function (data) {
			output += data;
		});
		
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
	});
	
	return ret.then((child: any) => {
		child.output = output;
		return child;
	}, (e) => {
		e.output = output;
		throw e;
	});
}

const debug_data = createLogger(LOG_LEVEL.DATA, 'process');

export function forkJspm(...argument: string[]): ChildProcess {
	const child = spawnNative(jspm, argument, {
		cwd: getStorageBaseFolder(),
		stdio: ['pipe', 'pipe', 'pipe'],
		env: process.env,
	});
	child.on('exit', () => {
		debug_data('jspm end: %s', argument);
	});
	return child;
}

export async function tryRunJspm(context: DownloadRequestContext<any>,
                                 ...argument: string[]): Promise<{output: string}&ChildProcessResult<null>> {
	
	try {
		return await runJspm(...argument);
	} catch (e) {
		context.response.setHeader('Content-Type', 'text/html');
		context.response.httpCode(HTTP.INTERNAL_SERVER_ERROR);
		context.response.sendRawData(`<h1>Error: ${e.message}</h1><pre>${e.output}</pre>`)
	}
}

const error = createLogger(LOG_LEVEL.ERROR, 'process');

export function killProcess(process: ChildProcess, SIGNAL: string = 'SIGHUP'): Promise<string|number> {
	return new Promise((resolve, reject) => {
		let to = setTimeout(() => {
			to = null;
			error('a process has force killed.');
			process.kill('SIGKILL');
		}, 5000);
		
		process.on('exit', (e) => {
			clearTimeout(to);
			resolve(e);
		});
		
		if (process.connected) {
			process.disconnect();
		}
		process.kill(SIGNAL);
	});
}
