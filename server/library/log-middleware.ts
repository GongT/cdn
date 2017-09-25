import {Handler} from "express-serve-static-core";

export function logMiddleware(): Handler {
	return (req, res, next) => {
		console.log('handler: %s', req.originalUrl);
		next();
	}
}
