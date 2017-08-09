import * as eta from "eta-lib";

import * as express from "express";
var git: any = require("simple-git");

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        git("modules/office").log(function(err: Error, log: { all: any[] }) {
            if (err) {
                eta.logger.warn("Could not get Git history: " + err.message);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({
                "commits": log.all,
                "permissionsUser": req.session["permissions"],
                "session": req.session
            });
        });
    }
}
