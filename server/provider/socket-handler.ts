import {createLogger} from "@gongt/ts-stl-server/debug";
import {LOG_LEVEL} from "@gongt/ts-stl-server/log/levels";
import {ChildProcess} from "child_process";
import {readFile, unlink} from "fs-extra";
import {fileExists} from "../library/file-exists";
import {getBundleLocation, getBundleTempLocation} from "../library/files";
import {forkJspm, killProcess} from "../library/run-cmd";

const debug = createLogger(LOG_LEVEL.ERROR, 'socket');

class TransitionHandler {
	private process: ChildProcess;
	private outputHandler: ((b: Buffer|string) => void)[];
	
	constructor() {
		this.onOutput = this.onOutput.bind(this);
		this.onEnd = this.onEnd.bind(this);
		this.outputHandler = [];
	}
	
	private print(data: string) {
		this.outputHandler.forEach((fn) => {
			fn(data + '\n');
		});
	}
	
	private onOutput(data: Buffer|string) {
		this.outputHandler.forEach((fn) => {
			fn(data);
		});
	}
	
	private onEnd(code: number, signal: string) {
		if (signal) {
			this.print(`\x1B[38;5;9mprocess exited, killed by signal ${signal}.\x1B[0m`);
		} else if (code === 0) {
			this.print(`\x1B[38;5;10mprocess exited, with return code ${code}.\x1B[0m`);
		} else {
			this.print(`\x1B[38;5;9mprocess exited, with return code ${code}.\x1B[0m`);
		}
		this.process = null;
	}
	
	create(commandline: string[]): Promise<boolean> {
		if (this.process) {
			debug('create process: already started: %s', commandline);
			this.print('\x1B[38;5;9mprocess is already started.\x1B[0m');
			return;
		}
		
		this.print('\x1B[38;5;14m+ create process: ' + commandline.join(' ') + '\x1B[0m');
		this.process = forkJspm(...commandline);
		this.process.stdout.on('data', this.onOutput);
		this.process.stderr.on('data', this.onOutput);
		this.process.on('exit', this.onEnd);
		
		return new Promise((resolve) => {
			this.process.on('exit', (code) => {
				resolve(code === 0);
			});
		});
	}
	
	async kill(signal?: string) {
		if (!this.process) {
			return;
		}
		this.outputHandler = [];
		return killProcess(this.process, signal).then(() => {
			this.process = null;
		});
	}
	
	finishInput() {
		if (this.process) {
			this.process.stdin.end();
		}
	}
	
	input(data: any) {
		if (this.process) {
			this.process.stdin.write(data);
		}
	}
	
	output(fn: (b: Buffer|string) => void) {
		this.outputHandler.push(fn);
	}
}

export function onConnection(spark) {
	const handler = new TransitionHandler();
	
	handler.output((data) => {
		if (data instanceof Buffer) {
			spark.write(data.toString('utf8'));
		} else {
			spark.write(data);
		}
	});
	
	spark.on('end', () => {
		handler.kill();
	});
	spark.on('data', ({type, payload}) => {
		if (type === 1) { // control
			handleControlAction(handler, spark, payload).then(() => {
				spark.write('\x1B[38;5;10maction complete.\x1B[0m\n');
			}, (err) => {
				spark.write(`\x1B[38;5;9m${err.message}\x1B[0m\n`);
			});
		} else { // I/O
			handler.input(payload);
		}
	});
}

async function handleControlAction(handler: TransitionHandler, spark: any, payload: any) {
	switch (payload.action) {
	case 'resize':
		return handleResize(handler, spark, payload.data);
	case 'end':
		return handler.finishInput();
	case 'kill':
		return handler.kill(payload.data);
	case 'command':
		return handleCommand(handler, spark, payload.data);
	case 'function':
		if (Array.isArray(payload.data)) {
			const [func, ...args] = payload.data;
			return handleFunction(handler, spark, func, args);
		} else {
			throw new Error(`unknown data: ${payload.data}`);
		}
	default:
		throw new Error(`unknown action: ${payload.action}`);
	}
}

export type ISize = {cols: number, rows: number};
function handleResize(handler: TransitionHandler, spark: any, data: ISize) {
	
}
function handleCommand(handler: TransitionHandler, spark: any, data: string) {
	handler.create(data.split(/\s+/)).catch();
}
async function handleFunction(handler: TransitionHandler, spark: any, fn: string, args: string[]) {
	let success: boolean;
	switch (fn) {
	case 'install_inject':
		success = await handler.create(['install', '-y', ...args]);
		if (!success) {
			return;
		}
		for (let name of args) {
			let [registry, base] = name.split(':');
			if (!base) {
				base = registry;
				registry = 'jspm';
			}
			await handler.create([
				'bundle',
				'-y',
				'--skip-rollup',
				'--minify',
				'--inject',
				'--no-mangle',
				//'--format', 'cjs',
				'--source-map-contents',
				base,
				`${getBundleLocation(base)}`,
			]);
			await handler.create([
				'depcache',
				base,
			]);
			
			spark.write(`\x1B[38;5;14mremove ${getBundleTempLocation(base)}.\x1B[38;5;9m\n`);
			if (await fileExists(base)) {
				await unlink(getBundleTempLocation(base));
			}
		}
		break;
	case 'config_init':
		await handler.create(['config', 'defaultTranspiler', 'false']);
		await handler.create(['config', 'strictSSL', 'false']);
		await handler.create(['config', 'registries.npm.registry', JsonEnv.gfw.npmRegistry.url]);
		await handler.create(['config',
			'registries.npm.auth',
			base64(`${JsonEnv.gfw.npmRegistry.user}:${JsonEnv.gfw.npmRegistry.pass}`),
		]);
		await handler.create(['config', 'registries.github.auth', JsonEnv.gfw.github.credentials]);
		const data = await readFile(process.env.HOME + '/.jspm/config');
		spark.write(data);
		break;
	}
}
function base64(s: string): string {
	return new Buffer(s).toString('base64')
}
