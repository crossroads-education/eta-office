import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["name", "username", "password"])
            || req.body.name == "" || req.body.password == "") {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        let password : string = eta.crypto.encrypt(req.body.password);
        let sql : string = `
            INSERT INTO LoginData (name, username, password)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password)`;
        let params : string[] = [req.body.name, req.body.username, password];
        eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            callback({"raw": "true"});
        });
    }
}
