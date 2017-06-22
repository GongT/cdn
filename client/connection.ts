let connected = false;

const Primus = require("./primus");

const connection = new Primus({
	reconnect: {
		retries: 3,
	},
});

connection.on('open', () => {
	connected = true;
});
connection.on('reconnect scheduled', function () {
	connected = false;
});

export const Connection = {
	get isConnected(): boolean {
		return connected;
	},
	on(event: string, callback: (...args: any[]) => void) {
		connection.on(event, callback);
	},
	once(event: string, callback: (...args: any[]) => void) {
		connection.on(event, function selfDestroy(...args) {
			callback(...args);
			connection.off(event, selfDestroy);
		});
	},
	write(data): boolean{
		if (!connected) {
			return false;
		}
		connection.write({
			type: 0,
			payload: data,
		});
		return true;
	},
	emit(event, data) {
		if (!connected) {
			return false;
		}
		sendEvent(event, data);
		return true;
	},
	forceReconnect() {
		connection.recovery.reconnect();
	},
};

function sendEvent(action, data) {
	connection.write({
		type: 1,
		payload: {
			action: action, data: data,
		},
	});
}
