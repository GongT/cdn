import "xterm/dist/xterm.css";
const XTerm = require("xterm");
require("xterm/lib/addons/fit/fit.js");

export type ISize = {cols: number, rows: number};
let size: ISize = {cols: 120, rows: 80};

const term = new XTerm({
	scrollback: 99999,
	cols: size.cols,
	rows: size.rows,
});
term.open(document.getElementById('terminalDisplay'), false);
term.fit();

term.on('resize', (data) => {
	size = {cols: data.cols, rows: data.rows};
});

term.on('data', () => {
	term.scrollToBottom();
});

export class TerminalWrapper {
	writeln(data: string) {
		term.writeln(data);
		term.scrollToBottom();
	}
	
	write(data: string) {
		term.write(data);
		term.scrollToBottom();
	}
	
	clear() {
		term.clear();
	}
	
	on(event: string, callback: (...args: any[]) => void) {
		term.on(event, callback);
	}
	
	size(): ISize;
	size(setSize: ISize): void;
	size(setSize?: ISize) {
		if (setSize) {
			term.resize(setSize.cols, setSize.rows);
			size.cols = setSize.cols;
			size.rows = setSize.rows;
		} else {
			return size;
		}
	}
	
	blur() {
		term.blur();
	}
}

export const Terminal: TerminalWrapper = new TerminalWrapper;
