const {Prism} = require('prismjs');
import "prismjs/plugins/line-highlight/prism-line-highlight.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/show-language/prism-show-language.css";
import "prismjs/plugins/show-language/prism-show-language.js";
import "prismjs/themes/prism-okaidia.css";

setTimeout(() => {
	Prism.highlightAll();
}, 500);
