import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let terms : eta.Term[] = eta.term.terms;
        callback({
            "selectTerms": terms
        });
    }
}
