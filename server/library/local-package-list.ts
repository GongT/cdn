import {splitName} from "../provider/socket-handler";
import {getLocalPackageList} from "./files";

const listFile = getLocalPackageList();

export function mergeInstalledPackage(packages: string[]) {
	listFile.uniqueAppend(packages);
	listFile.write();
}

export function removeInstalledPackage(packages: string[]) {
	for (let name of packages) {
		const [registry, base] = splitName(name);
		listFile.remove(base);
		listFile.remove(`jspm:${base}`);
		listFile.remove(`npm:${base}`);
		listFile.remove(`github:${base}`);
	}
	listFile.write();
}

export function installedPackages(): string[] {
	return listFile.content.splice();
}
