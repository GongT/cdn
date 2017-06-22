import {Server} from "http";
import {onConnection} from "./socket-handler";
const Primus = require("primus");

export function createWebSocket(server: Server) {
	return new Promise((resolve, reject) => {
		const wrappedCallback = (err, data) => err? reject(err) : resolve(data);
		
		const primus = new Primus(server, {
			transformer: 'websockets',
		});
		primus.save(__dirname + '/../client-code/primus.js', wrappedCallback);
		
		primus.on('connection', onConnection);
	});
}

