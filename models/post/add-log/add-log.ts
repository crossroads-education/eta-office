import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["about", "message", "type"])) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        eta.permission.getUser(req.session["userid"], (user : eta.PermissionUser) => {
            if (user === null) {
                callback({errcode: eta.http.InternalError});
                return;
            }
            if ((req.body.type == "FRONT" && !user.has("add/log/front")) ||
                (req.body.type == "MANGR" && !user.has("add/log/manager")) ||
                (req.body.type == "CLOCK" && !user.has("add/log/clock"))) {
                    callback({errcode: eta.http.Forbidden});
                    return;
            }
            let sql : string = "INSERT IGNORE INTO `Log`(`author`, `about`, `message`, `type`) VALUES(?, ?, ?, ?)";
            eta.db.query(sql, [req.session["userid"], req.body.about, req.body.message, req.body.type], (err : eta.DBError, rows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                callback({raw: "true"});
            });
        });
    }
}
