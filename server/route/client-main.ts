import {HtmlContainer} from "@gongt/ts-stl-server/express/middlewares/html-render";
import {Application} from "express-serve-static-core";
import {jspm} from "./client-jspm";

const indexMainBody = `
<div class="headerLine">
	<h1>JSPM CDN</h1>
	<div>
		<div>
			<a href="/browser" target="browser">浏览器</a>
		</div>
		<div>
			<button id="btnKill">SIGKILL</button>
		</div>
		<div>
			<button id="btnTerm">SIGTERM</button>
		</div>
		<div>
			<button id="btnEnd">End Input</button>
		</div>
		<div>
			<button id="btnReconnect">断开并重新链接</button>
		</div>
		<div>
			<button id="btnClear">清除控制台</button>
		</div>
	</div>
</div>
<div class="controlLine">
	<span>运行jspm命令</span>
	<input id="commandline" class="grow" type="text" autocomplete="off" placeholder="command line...">
	<input id="runbutton" type="button" value="RUN">
</div>
<div class="controlLine">
	<span>运行预定义过程</span>
	<select id="funcname">
		<option value="" selected> -- </option>
		<optgroup label="安装删除">
			<option value="install_inject">下载并打包</option>
			<option value="install_everything">下载全部依赖</option>
			<option value="uninstall">删除</option>
		</optgroup>
		<optgroup label="depcache">
			<option value="update_dep_cache">生成depcache</option>
			<option value="remove_dep_cache">删除depcache</option>
		</optgroup>
		<optgroup label="打包">
			<option value="create_bundles_minify">打包并压缩</option>
			<option value="create_bundles">打包测试</option>
			<option value="delete_bundles">删除打包文件</option>
			<option value="create_build_minify">整体打包并压缩</option>
			<option value="create_build">整体打包测试</option>
			<option value="delete_build">删除整体打包文件</option>
		</optgroup>
		<optgroup label="其他">
			<option value="update_cache">更新jspm.config.js缓存</option>
			<option value="config_init">初始化配置文件</option>
			<option value="installed_show">显示所有已注册包</option>
		</optgroup>
	</select>
	<input id="funcargs" class="grow" type="text" style="flex-grow:1" autocomplete="off" placeholder="参数">
	<input id="funcbutton" type="button" value="RUN">
</div>
<div id="terminalDisplay"></div>
<style>
.title {
	font-size: smaller;
}
</style>
`;

export function mountClient(app: Application) {
	// home page init
	const html = new HtmlContainer;
	html.addHead('<title>jspm operation</title>');
	html.plugin(jspm);
	
	// main html structure
	html.stylesheet('/public/main.css');
	html.addBody(indexMainBody);
	
	// finalize
	app.get('/', html.createMiddleware());
}
