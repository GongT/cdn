import {access, accessSync} from "fs-extra";
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

export function fileExistsSync(path: string, mode?: number) {
	try {
		accessSync(path, mode);
		return true;
	} catch (e) {
		return false;
	}
}
