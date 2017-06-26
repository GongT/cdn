import {Connection} from "./connection";
import {Terminal} from "./terminal";

const commandLine: HTMLInputElement = <any>document.getElementById('commandline');
const runButton = document.getElementById('runbutton');

runButton.addEventListener('click', () => {
	if (!Connection.isConnected) {
		Terminal.writeln('\x1B[38;5;9mnot connected.\x1B[0m');
		return;
	}
	console.log('try run command: ', commandLine.value);
	Connection.emit('command', commandLine.value);
});

const funcName: HTMLInputElement = <any>document.getElementById('funcname');
const funcArgs: HTMLInputElement = <any>document.getElementById('funcargs');
const funcButton = document.getElementById('funcbutton');

funcButton.addEventListener('click', () => {
	if (!Connection.isConnected) {
		Terminal.writeln('\x1B[38;5;9mnot connected.\x1B[0m');
		return;
	}
	if (!funcName.value) {
		return;
	}
	
	Connection.emit('function', [funcName.value, funcArgs.value]);
});

document.getElementById('btnReconnect').addEventListener('click', () => {
	Connection.forceReconnect();
});
document.getElementById('btnClear').addEventListener('click', () => {
	Terminal.clear();
});
document.getElementById('btnEnd').addEventListener('click', () => {
	Connection.emit('end', []);
});
document.getElementById('btnKill').addEventListener('click', () => {
	Connection.emit('kill', ['SIGKILL']);
});
document.getElementById('btnTerm').addEventListener('click', () => {
	Connection.emit('kill', ['SIGTERM']);
});


