import {GlobalVariable} from "@gongt/ts-stl-library/pattern/global-page-data";
import {HtmlContainer} from "@gongt/ts-stl-server/express/middlewares/html-render";
import {Application} from "express-serve-static-core";
import {readFile} from "fs-extra";
import {basename, extname, resolve} from "path";
import {fileExists} from "../library/file-exists";
import {getStorageBaseFolder} from "../library/files";
import {jspm} from "./client-jspm";

const extMap = {
	'js': 'javascript',
	'coffee': 'coffeescript',
	'gitignore': 'git',
	'ts': 'typescript',
	'tsx': 'typescript',
	'md': 'markdown',
};

export function mountBrowser(app: Application) {
	const baseDir = getStorageBaseFolder();
	
	const html = new HtmlContainer();
	html.plugin(jspm, {packageName: 'client/browser'});
	html.addBody(`<div class="wrap">
<div class="control">
	<div class="right">
		<a href="/storage/<%- file %>" target="_blank">RAW</a>
	</div>
	<div class="left">
		<a href="###" onclick="history.back()">&Lt; Back</a>
	</div>
</div>
<hr />
<div>
	<pre class="content line-numbers language-<%- lang %>"><code style="display:inline-block;margin-left:50px;"><%- content %></code></pre>
</div>
</div>`);
	html.addHead(`<title><%- base %></title>`);
	html.addHead(`<style>
body {
    padding: 80px 100px;
    font: 13px "Helvetica Neue", "Lucida Grande", "Arial";
    background: #ECE9E9 -webkit-gradient(linear, 0% 0%, 0% 100%, from(#fff), to(#ECE9E9));
    background: #ECE9E9 -moz-linear-gradient(top, #fff, #ECE9E9);
    background-repeat: no-repeat;
    color: #555;
    -webkit-font-smoothing: antialiased;
}
.right{
	float: right;
}
</style>`);
	
	html.compile();
	app.use('/browser', require('serve-index')(baseDir, {
		hidden: true,
		icons: true,
		view: 'details',
	}), async (req, res, next) => {
		const file = decodeURIComponent(req.url)
			.replace(/^\/browser\//, '')
			.replace(/^\//, '')
			.replace(/\.\./g, '');
		
		const filePath = resolve(baseDir, file);
		
		const exists = await fileExists(filePath);
		if (!exists) {
			console.error('failed to open file: %s', filePath);
			return next();
		}
		
		try {
			const content = await readFile(filePath, 'utf-8');
			const ext = extname(filePath).replace(/^\./, '');
			const base = basename(filePath);
			const lang = extMap[ext] || ext;
			
			res.send(await html.render({
				global: new GlobalVariable(req),
				variables: {
					content,
					lang,
					base,
					file,
				},
				request: req,
			}));
		} catch (e) {
			next(e);
		}
	});
	
}
