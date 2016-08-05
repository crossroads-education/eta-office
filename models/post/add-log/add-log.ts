import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["about", "message", "type"])) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        let user : eta.PermissionUser = req.session["permissions"];
        if ((req.body.type == "FRONT" && !user.has("add/log/front")) ||
            (req.body.type == "MANGR" && !user.has("add/log/manager")) ||
            (req.body.type == "CLOCK" && !user.has("add/log/clock"))) {
                callback({errcode: eta.http.Forbidden});
                return;
        }
        if (req.body.about == "userid") {
            req.body.about = req.session["userid"];
        }
        let nowDate : Date = new Date();
        let now : string = eta.time.getStandardDatetime(nowDate);
        let sql : string = "INSERT IGNORE INTO `Log`(`author`, `about`, `message`, `type`, `timestamp`) VALUES(?, ?, ?, ?, ?)";
        let params : string[] = [req.session["userid"], req.body.about, req.body.message, req.body.type, now];
        eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            sql = `
                SELECT
                    CONCAT(AboutPerson.firstName, ' ', AboutPerson.lastName) AS about,
                    CONCAT(AuthorPerson.firstName, ' ', AuthorPerson.lastName) AS author
                FROM
                    Log
                        LEFT JOIN Person AboutPerson ON
                            Log.about = AboutPerson.id
                        LEFT JOIN Person AuthorPerson ON
                            Log.author = AuthorPerson.id
                WHERE
                    Log.author = ? AND
                    Log.timestamp = ?`;
            params = [req.session["userid"], now];
            eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                let data : {[key : string] : string} = {
                    "about": rows[0].about,
                    "author": rows[0].author,
                    "message": req.body.message,
                    "timestamp": nowDate.toLocaleString()
                };
                callback({
                    raw: JSON.stringify(data)
                });
            });
        });
    }
}
