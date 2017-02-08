import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["userid", "positions"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        eta.person.getByUsernameOrID(req.body.userid, req.body.userid, (person: eta.Person) => {
            if (person === null) {
                callback({ errcode: eta.http.NotFound });
                return;
            }
            // some columns are not explicitly listed because they are implicitly null
            let sql: string = `
                INSERT INTO Employee
                (id, current, international, maxHours, minHours, shirt, hoodie, mentor, workStudy)
                VALUES(?, 1, 0, 12, 27, '', '', -1, 0)
                ON DUPLICATE KEY UPDATE current = 1`;
            eta.db.query(sql, [person.id], (err: eta.DBError, rows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                let positions: string[] = JSON.parse(req.body.positions);
                let moreSql: string = "(?, ?, CURDATE(), NULL),".repeat(positions.length);
                let params: string[] = [];
                for (let i: number = 0; i < positions.length; i++) {
                    params.push(person.id);
                    params.push(positions[i]);
                }
                sql = `
                    INSERT INTO EmployeePosition (id, position, start, end)
                    VALUES ${moreSql.substring(0, moreSql.length - 1)}
                    ON DUPLICATE KEY UPDATE start = VALUES(start), end = VALUES(end)`;
                eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({ errcode: eta.http.InternalError });
                        return;
                    }
                    callback({ "raw": "true" });
                });
            });
        });
    }
}
