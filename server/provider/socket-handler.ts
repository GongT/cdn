import {createLogger} from "@gongt/ts-stl-server/debug";
import {LOG_LEVEL} from "@gongt/ts-stl-server/log/levels";
import {ChildProcess} from "child_process";
import {unlink} from "fs-extra";
import {fileExists} from "../library/file-exists";
import {forkJspm, killProcess} from "../library/run-cmd";
import {handleControlAction} from "./socket-actions";

const debug = createLogger(LOG_LEVEL.ERROR, 'socket');

export class TransitionHandler {
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

let globalLock: string = null;
export function requireLock(lockId: string, spark: any) {
	if (globalLock) {
		throw new Error('jspm config has lock. must wait process finish.');
	} else {
		spark.globalLocked = true;
		globalLock = lockId;
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
		if (spark.globalLocked) {
			globalLock = null;
		}
		handler.kill().catch();
	});
	spark.on('data', ({type, payload}) => {
		if (type === 1) { // control
			const lockId = Date.now().toFixed(0) + (Math.random() * 10000).toFixed(0);
			handleControlAction(lockId, handler, spark, payload).then(() => {
				spark.write('\x1B[38;5;10maction complete.\x1B[0m\n');
			}, (err) => {
				spark.write(`\x1B[38;5;9m${err.message}\x1B[0m\n`);
			}).then(() => {
				if (globalLock === lockId) {
					globalLock = null;
				}
			});
		} else { // I/O
			handler.input(payload);
		}
	});
}

export function splitName(name) {
	let [registry, base] = name.split(':');
	if (!base) {
		base = registry;
		registry = 'jspm';
	}
	return [registry, base];
}

export async function removeFile(spark: any, file: string) {
	if (await fileExists(file)) {
		try {
			await unlink(file);
			spark.write(`\x1B[38;5;14mremove ${file}.\x1B[0m\n`);
		} catch (e) {
			spark.write(`\x1B[38;5;9mremove ${file} failed: ${e.message}\x1B[0m\n`);
			return false;
		}
	} else {
		spark.write(`\x1B[2mremove ${file} - not exists.\x1B[0m\n`);
	}
	return true;
}
