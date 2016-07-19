import * as eta from "eta-lib";
import * as schedule from "../../lib/templates/Schedule";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        callback({});
    }
}
