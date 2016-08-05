import * as eta from "eta-lib";
import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let sql: string = `
        SELECT DISTINCT
            name,
            open
        FROM
            Position
        WHERE
            active = 1 AND
            category != "Management"`;
        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            callback({positions: rows});
        });
    }
}
