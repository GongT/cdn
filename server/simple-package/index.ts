import {HtmlContainer} from "@gongt/ts-stl-server/express/middlewares/html-render";
import {JspmConstructOptions, JspmHtmlConfig, JspmPackagePlugin} from "@gongt/ts-stl-server/express/render/jspm";
import {resolve} from "url";
import {getBaseUrl} from "./get-base";

export class JspmCdnPlugin extends JspmPackagePlugin {
	protected remoteBaseUrl: string;
	
	constructor(options?: Partial<{baseUrl: string}&JspmConstructOptions>) {
		super(options);
		if (options) {
			this.remoteBaseUrl = options.baseUrl;
		}
		if (!this.remoteBaseUrl) {
			this.remoteBaseUrl = getBaseUrl();
		}
	}
	
	public get remotePackageUrl() {
		return resolve(this.remoteBaseUrl, 'storage/jspm_packages') + '/';
	}
	
	public get remoteConfigUrl(): string {
		return resolve(this.remoteBaseUrl, 'jspm.config.js');
	}
	
	public get systemJsUrl(): string {
		return resolve(this.remoteBaseUrl, this._opts.debug? 'storage/jspm_packages/system.src.js' : 'storage/jspm_packages/system.js');
	}
	
	__modify_html(html: HtmlContainer, options: JspmHtmlConfig): void {
		super.__modify_html(html, options);
		html.script(this.remoteConfigUrl, 'jspm-config-cdn');
	}
	
	public getHtmlResult() {
		const data = super.getHtmlResult();
		return `<script crossorigin="anonymous" src="${this.remoteConfigUrl}" data-debug="jspm-config-cdn" type="text/javascript"></script>`
		       + data;
	}
}
