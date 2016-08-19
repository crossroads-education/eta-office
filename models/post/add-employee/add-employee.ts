import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["userid"])) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        eta.person.getByUsernameOrID(req.body.userid, req.body.userid, (person : eta.Person) => {
            if (person === null) {
                callback({errcode: eta.http.NotFound});
                return;
            }
            // some columns are not explicitly listed because they are implicitly null
            let sql : string = `
                INSERT IGNORE INTO Employee
                (id, current, international, maxHours, minHours, shirt, hoodie, mentor)
                VALUES(?, 1, 0, 12, 27, '', '', -1)`;
            eta.db.query(sql, [req.body.userid], (err : eta.DBError, rows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                callback({"raw": "true"});
            });
        });
    }
}
