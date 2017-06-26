import {JsonEnv} from "@gongt/jenv-data";
import {PROJECT_NAME} from "./global";

export function getBaseUrl() {
	let base = (JsonEnv && JsonEnv.services["jspm-library"].serverUrl) ||
	           '//' + PROJECT_NAME + '.' + JsonEnv.baseDomainName + '/';
	if (!/\/$/.test(base)) {
		base += '/';
	}
	return base;
}
