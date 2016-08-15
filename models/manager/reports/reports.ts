import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        callback({
            "currentTerm": eta.term.getCurrent().id,
            "terms": eta.term.getClosest(eta.term.getCurrent())
        });
    }
}
