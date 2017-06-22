import {ApiRequest} from "@gongt/ts-stl-library/request/protocol";
import {ERequestType} from "@gongt/ts-stl-library/request/request";
import {DownloadHandler} from "@gongt/ts-stl-server/express/raw-handler";
import {getBundleLocation} from "../library/files";
import {tryRunJspm} from "../library/run-cmd";

export interface Req extends ApiRequest {
	library: string;
	registry?: string;
}

export const handler = new DownloadHandler<Req>(ERequestType.TYPE_GET, '/download/:library');
handler.setMimeType('text/javascript');
handler.handleArgument('library').fromPath();
handler.handleArgument('registry').fromGet().optional('npm');
handler.setHandler(async (context) => {
	let {library, registry} = context.params;
	if (/\.js$/.test(library)) {
		library = library.replace(/\.js$/, '');
	}
	
	const loc = getBundleLocation(library);
	
	console.log('----------------', library, loc);
	
	const result = await tryRunJspm(context, 'install', '-y', registry + ':' + library);
	
});
