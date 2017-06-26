import {TransitionHandler} from "./socket-handler";

export function handleCommand(handler: TransitionHandler, spark: any, data: string) {
	return handler.create(data.split(/\s+/));
}
