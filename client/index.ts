import {Connection} from "./connection";
import "./dom";
import {Terminal} from "./terminal";

Object.assign(window, {Terminal, Connection});

Terminal.writeln('connecting...');

Terminal.on('data', (data) => {
	Connection.write(data);
});

Connection.on('data', (data) => {
	Terminal.write(data.replace(/\n(?!\r)/g, '\n\r'));
});

Connection.once('open', () => {
	Terminal.clear();
	Terminal.writeln('\x1B[38;5;10mremote connected.\x1B[0m');
});
Connection.on('open', () => {
	Connection.emit('resize', Terminal.size());
});

Connection.on('reconnect scheduled', (opts) => {
	Terminal.blur();
	Terminal.write(`\x1B[K\x1B[38;5;9mReconnecting in ${opts.scheduled} ms. ${opts.attempt}/${opts.retries}....\x1B[0m\r`);
});

Connection.on('reconnect failed', () => {
	Terminal.writeln(`\x1B[K\x1B[38;5;9mFatal Error: reconnect failed.\x1B[0m`);
});

Connection.on('reconnected', () => {
	Terminal.writeln(`\x1B[K\x1B[38;5;14mReconnected\x1B[0m.`);
});
