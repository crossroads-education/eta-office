import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["id", "positions"])) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        let positions : {id : string, start : string, end : string}[] = JSON.parse(req.body.positions);
        let moreSql : string = "(?, ?, ?, ?),";
        let params : string[] = [];
        for (let i : number = 0; i < positions.length; i++) {
            params.push(req.body.id, positions[i].id, positions[i].start, positions[i].end);
        }
        moreSql = moreSql.repeat(params.length / 4);
        let sql : string = `
            INSERT INTO EmployeePosition (id, position, start, end)
            VALUES ${moreSql.substring(0, moreSql.length - 1)}
            ON DUPLICATE KEY UPDATE start = VALUES(start), end = VALUES(end)`;
        eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            callback({raw: "true"});
        });
    }
}
