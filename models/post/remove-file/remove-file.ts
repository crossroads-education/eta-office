import * as eta from "eta-lib";

import * as fs from 'fs';

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["id", "file"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let dir: string = eta.server.modules["office"].baseDir + "static/files/employee-files/" + req.body.id + "/";
        fs.unlink(dir + req.body.file, function(err) {
            if (err) {
                eta.logger.error(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({ raw: "true" });
        });
    }
}
