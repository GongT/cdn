import {installedPackages} from "../library/local-package-list";
import {resolvePackageCmdItem} from "../library/package-name";

export async function handleDisplayAll(handler, spark: any) {
	spark.write('已注册的依赖包：\n');
	spark.write('\t' + installedPackages().join('\n\t') + '');
	spark.write('\n\n横向显示：\n');
	const index = [];
	const indexPackage = [];
	for (const name of installedPackages()) {
		const packageIndex = await resolvePackageCmdItem(name, handler);
		index.push(name);
		indexPackage.push(packageIndex);
	}
	spark.write(index.join(' '));
	spark.write('\n\n');
	spark.write('\n\n横向 + 显示：\n');
	spark.write(indexPackage.join(' + '));
	spark.write('\n\n');
}
