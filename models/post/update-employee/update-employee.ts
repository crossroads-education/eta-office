import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["id", "positions", "mentor", "allowances"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        if (!req.body.term) {
            req.body.term = eta.term.getCurrent().id;
        }
        let positions: { id: string, start: string, end: string }[] = JSON.parse(req.body.positions);
        let allowances: { [key: string]: boolean } = JSON.parse(req.body.allowances);
        let moreSql: string = "(?, ?, ?, ?),";
        let params: string[] = [];
        for (let i: number = 0; i < positions.length; i++) {
            params.push(req.body.id, positions[i].id, positions[i].start, positions[i].end);
        }
        moreSql = moreSql.repeat(params.length / 4);
        let sql: string = `
            INSERT INTO EmployeePosition (id, position, start, end)
            VALUES ${moreSql.substring(0, moreSql.length - 1)}
            ON DUPLICATE KEY UPDATE
                start = VALUES(start),
                end = VALUES(end)`;
        eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            sql = `
                INSERT INTO EmployeeAllowance (id, term, alarm, call1, call2, sick, hw1, hw2, hw3)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    alarm = VALUES(alarm),
                    call1 = VALUES(call1),
                    call2 = VALUES(call2),
                    sick  = VALUES(sick),
                    hw1   = VALUES(hw1),
                    hw2   = VALUES(hw2),
                    hw3   = VALUES(hw3)`;
            params = [req.body.id, req.body.term, allowances["alarm"], allowances["call1"], allowances["call2"], allowances["sick"], allowances["hw1"], allowances["hw2"], allowances["hw3"]];
            eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                sql = "UPDATE Employee SET mentor = ? WHERE id = ?";
                params = [req.body.mentor, req.body.id];
                eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({ errcode: eta.http.InternalError });
                        return;
                    }
                    callback({ raw: "true" });
                });
            });
        });
    }
}
