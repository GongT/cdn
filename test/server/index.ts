import {JspmCdnPlugin} from "@gongt/jspm";
import {createExpressApp} from "@gongt/ts-stl-server/boot/express-app-builder";
import {bootExpressApp} from "@gongt/ts-stl-server/boot/express-init";
import {HtmlContainer} from "@gongt/ts-stl-server/express/middlewares/html-render";
import {provideWithExpress} from "@gongt/ts-stl-server/express/middlewares/well-known-provider";

const builder = createExpressApp();

const app = builder.generateApplication();

const html = new HtmlContainer;
const jspm: JspmCdnPlugin = new (require('../../dist/simple-package').JspmCdnPlugin)();
html.plugin(jspm);

provideWithExpress(app, jspm);

app.get('/', html.createMiddleware());

bootExpressApp(app).catch();
