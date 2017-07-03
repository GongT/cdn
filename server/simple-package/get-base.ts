import {JsonEnv} from "@gongt/jenv-data";
import {PROJECT_NAME} from "./global";

export function getBaseUrl() {
	let base: string;
	if (JsonEnv) {
		try {
			base = JsonEnv.services.jspm.serverUrl ||
			       '//' + PROJECT_NAME + '.' + JsonEnv.baseDomainName + '/';
		}catch(e){}
	}
	if(!base){
		throw new Error();
	}
	if (!/\/$/.test(base)) {
		base += '/';
	}
	return base.replace(/^https?:/, '');
}
