import {installedPackages} from "../library/local-package-list";
export function handleDisplayAll(handler, spark: any) {
	spark.write('已注册的依赖包：\n');
	spark.write('\t' + installedPackages().join('\n\t') + '');
	spark.write('\n\n横向显示：\n');
	spark.write(installedPackages().join(' '));
	spark.write('\n\n');
}
