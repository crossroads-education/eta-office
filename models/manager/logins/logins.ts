import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let sql : string = `
            SELECT
                name, username, password
            FROM
                LoginData
            ORDER BY name`;
        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            let logins : {name : string, username : string, password : string}[] = rows;
            for (let i : number = 0; i < logins.length; i++) {
                logins[i].password = eta.crypto.decrypt(logins[i].password);
            }
            callback({
                "logins": logins
            });
        });
    }
}
