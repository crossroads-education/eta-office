import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {

    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = "SELECT firstName, lastName, id FROM Person WHERE id = ?";
        eta.db.query(sql, [req.session["userid"]], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            sql = `
                SELECT
                    COUNT(*) as count
                FROM
                    EmployeeTimesheet
                WHERE
                    id = ? AND
                    DATE(timeIn) = CURDATE() AND
                    ISNULL(timeOut)`;
            let env: { [key: string]: any } = rows[0];
            eta.db.query(sql, [req.session["userid"]], (err: eta.DBError, timeCountRows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                env["needsClockIn"] = timeCountRows[0].count == 0;
                req.session["needsClockIn"] = env["needsClockIn"];
                sql = `
                    SELECT
                        timeIn, timeOut
                    FROM
                        EmployeeTimesheet
                    WHERE
                        id = ?
                    ORDER BY timeIn DESC`;
                eta.db.query(sql, [req.session["userid"]], (err: eta.DBError, timesheetRows: any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({ errcode: eta.http.InternalError });
                        return;
                    }
                    env["timesheet"] = timesheetRows
                    callback(env);
                });
            })
        })
    }
}
