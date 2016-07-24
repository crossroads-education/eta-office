import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["term", "cells"])) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        let cells : any[] = JSON.parse(req.body.cells);
        let moreSql : string = "(?, ?, ?, ?, ?, ?),";
        let params : string[] = [];
        for (let i : number = 0; i < cells.length; i++) {
            params = params.concat([req.session["userid"], -1, cells[i].time, cells[i].day, req.body.term, cells[i].isAvailable ? 1 : 0]);
        }
        moreSql = moreSql.repeat(params.length / 6);
        let sql : string = `
            INSERT INTO
                EmployeeSchedule (id, center, time, day, term, isAvailable)
            VALUES ${moreSql.substring(0, moreSql.length - 1)}
            ON DUPLICATE KEY UPDATE isAvailable = VALUES(isAvailable)
        `;
        eta.logger.trace(sql);
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
