import * as eta from "eta-lib";

import * as express from "express";
import * as git from "simple-git";

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
                "session": req.session
            });
        });
    }
}
