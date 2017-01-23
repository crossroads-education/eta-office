import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        eta.logger.json(req.body);
        if (!eta.params.test(req.body, ["username"])) {
            return callback({
                errcode : eta.http.InvalidParameters
            });
        } else {
            eta.login.login(req.body.username, req, (env : { [key: string]: any }) => {
                req.session["returnTo"] = "/office/manager/sudo";
                eta.redirect.back(req, res);
            });
        }
    }
}
