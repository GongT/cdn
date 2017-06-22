import {createLogger} from "@gongt/ts-stl-server/debug";
import {LOG_LEVEL} from "@gongt/ts-stl-server/log/levels";
import {ChildProcess} from "child_process";
import {getBundleLocation} from "../library/files";
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
	
	kill() {
		if (!this.process) {
			return;
		}
		this.outputHandler = [];
		killProcess(this.process).then(() => {
			this.process = null;
		});
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
			switch (payload.action) {
			case 'resize':
				return handleResize(handler, spark, payload.data);
			case 'command':
				return handleCommand(handler, spark, payload.data);
			case 'function':
				if (Array.isArray(payload.data)) {
					const [func, ...args] = payload.data;
					return handleFunction(handler, spark, func, args);
				} else {
					spark.write(`\x1B[38;5;9munknown data: ${payload.data}\x1B[0m\n`);
					return;
				}
			default:
				spark.write(`\x1B[38;5;9munknown action: ${payload.action}\x1B[0m\n`);
			}
		} else { // I/O
			handler.input(payload);
		}
	});
}

export type ISize = {cols: number, rows: number};
function handleResize(handler: TransitionHandler, spark: any, data: ISize) {
	
}
function handleCommand(handler: TransitionHandler, spark: any, data: string) {
	handler.create(data.split(/\s+/)).catch();
}
async function handleFunction(handler: TransitionHandler, spark: any, fn: string, args: string[]) {
	spark.write('\x1Bc');
	switch (fn) {
	case 'install_inject':
		const success = await handler.create(['install', '-y', ...args]);
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
				'-y',
				base,
			]);
		}
	}
	spark.write('action complete.\n');
}
