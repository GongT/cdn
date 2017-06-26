import {readFile} from "fs-extra";
import {TransitionHandler} from "provider/socket-handler";

export async function handleConfigInit(handler: TransitionHandler, spark: any, fn: string, args: string[]) {
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
}

function base64(s: string): string {
	return new Buffer(s).toString('base64')
}
