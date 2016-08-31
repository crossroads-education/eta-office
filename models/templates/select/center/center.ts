import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let department : number = req.session["department"];
        eta.center.getAll(function(rawCenters : eta.Center[]) {
            let centers : eta.Center[] = [];
            for (let i : number = 0; i < rawCenters.length; i++) {
                if (rawCenters[i].department == department) {
                    centers.push(rawCenters[i]);
                }
            }
            callback({
                "selectCenters": centers
            });
        });
    }
}
