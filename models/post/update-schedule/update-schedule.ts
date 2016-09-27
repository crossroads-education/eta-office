import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["day", "term", "cells"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let moreSql: string = "WHEN id = ? AND time = ? THEN ?\n";
        let params: string[] = [];
        let cells: any[] = JSON.parse(req.body.cells);
        if (cells.length === 0) {
            callback({ raw: "true" });
            return;
        }
        eta.center.getAll(function(centers: eta.Center[]) {
            for (let i: number = 0; i < cells.length; i++) {
                let center: number = -1;
                for (let k: number = 0; k < centers.length; k++) {
                    if (centers[k].code == cells[i].centerCode) {
                        center = centers[k].id;
                        break;
                    }
                }
                params = params.concat([cells[i].userid, cells[i].time, center]);
            }
            let sql: string = `
                UPDATE
                    EmployeeSchedule
                SET
                    center = (CASE
                        ${moreSql.repeat(params.length / 3)}
                        ELSE EmployeeSchedule.center
                    END)
                WHERE day = ? AND term = ?
            `;
            params.push(req.body.day);
            params.push(req.body.term);
            eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                callback({ raw: "true" });
            });
        });
    }
}
