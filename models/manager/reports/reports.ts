import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        // TODO: Implement department-specific reports, or disable when not MAC
        if (req.session["department"] !== 1) {
            callback({errcode: eta.http.Forbidden});
            return;
        }
        callback({
            "currentTerm": eta.term.getCurrent().id,
            "terms": eta.term.getClosest(eta.term.getCurrent())
        });
    }
}
