import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = "UPDATE EmployeeTimesheet SET timeOut = NOW(), ipOut = ? WHERE DATE(timeIn) = CURDATE() AND id = ? AND timeOut IS NULL";
        let ipTokens: string[] = req.ip.split(":"); // remove IPv6 prepend stuff
        let params: string[] = [ipTokens[ipTokens.length - 1], req.session["userid"]];
        if (req.session["needsClockIn"]) {
            sql = "INSERT INTO EmployeeTimesheet (ipIn, id, ipOut, timeIn, timeOut) VALUES (?, ?, NULL, NOW(), NULL)";
        }
        eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            req.session["needsClockIn"] = !req.session["needsClockIn"];
            callback({ raw: req.session["needsClockIn"] ? "out" : "in" });
        });
    }
}
