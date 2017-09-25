import "@gongt/jenv-data/global";
import {REQUEST_METHOD} from "@gongt/ts-stl-library/request/request-method";
import {createExpressApp} from "@gongt/ts-stl-server/boot/express-app-builder";
import {bootExpressApp} from "@gongt/ts-stl-server/boot/express-init";
import {initServiceWait} from "@gongt/ts-stl-server/boot/init-systemd-service";
import {CrossDomainMiddleware} from "@gongt/ts-stl-server/communication/crossdomain/middleware";
import {initDefaultDatabaseConnection, waitDatabaseToConnect} from "@gongt/ts-stl-server/database/mongodb";
import {resolve} from "path";
import {initStorage} from "./library/files";
import {createWebSocket} from "./provider/jspm-real-time";
import {mountBrowser} from "./route/browser";
import {initJspmConfig} from "./route/client-jspm";
import {mountClient} from "./route/client-main";
import {mountLoader} from "./route/jspm.config";

export const SERVER_ROOT = resolve(__dirname, '..');

initStorage();

const builder = createExpressApp();
builder.setServerRootPath(resolve(__dirname, '../source-storage'));

const cors = new CrossDomainMiddleware;
cors.allowCredentials(false);
cors.allowMethods(REQUEST_METHOD.GET, REQUEST_METHOD.OPTIONS);
builder.setCors('/', cors);

mountLoader(builder);

const app = builder.generateApplication();

initJspmConfig(app);
mountBrowser(app);
mountClient(app);

initDefaultDatabaseConnection(JsonEnv.DataBaseUrlTemplate.replace('%DATABASE-NAME%', 'cdn-source'));

const final = Promise.all([
	waitDatabaseToConnect(),
]).then(() => {
	return bootExpressApp(app);
}).then((httpServer) => {
	return createWebSocket(httpServer);
});
initServiceWait(final);
