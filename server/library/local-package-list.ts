import {splitName} from "../provider/socket-handler";
import {getLocalPackageList} from "./files";
import {removePackageCmdItemCache} from "./package-name";

const listFile = getLocalPackageList();

export function mergeInstalledPackage(packages: string[]) {
	const names = [];
	for (let pkgName of packages) {
		removePackageCmdItemCache(pkgName);
		const [registry, base] = splitName(pkgName);
		names.push(`${registry}:${base}`)
	}
	listFile.uniqueAppend(names);
	listFile.content.sort((a, b) => {
		return (a > b)? 1 : -1;
	});
	listFile.write();
}

export function removeInstalledPackage(packages: string[]) {
	for (let name of packages) {
		const [registry, base] = splitName(name);
		removePackageCmdItemCache(name);
		listFile.remove(base);
		listFile.remove(`jspm:${base}`);
		listFile.remove(`npm:${base}`);
		listFile.remove(`github:${base}`);
	}
	listFile.write();
}

export function installedPackages(): string[] {
	return listFile.content.slice();
}

export function installedPackageNames(): string[] {
	return listFile.content.map((e) => {
		const [reg, base] = splitName(e);
		return base;
	});
}
