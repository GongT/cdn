import {access} from "fs";
export function fileExists(path: string, mode?: number) {
	return new Promise<any>((resolve, reject) => {
		access(path, mode, (e) => {
			if (e) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}
