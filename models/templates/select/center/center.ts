import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        eta.center.getAll(function(centers : eta.Center[]) {
            callback({
                "selectCenters": centers
            });
        });
    }
}
