import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["center", "term", "hours"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let hours: { open: string, close: string }[] = JSON.parse(req.body.hours);
        let moreSql: string = "(?, ?, ?, ?, ?),";
        let params: string[] = [];
        for (let i: number = 0; i < hours.length; i++) {
            params = params.concat([req.body.term, req.body.center, i, hours[i].open, hours[i].close]);
        }
        moreSql = moreSql.repeat(params.length / 5);
        let sql: string = `
            INSERT INTO HoursOfOperation (term, center, day, open, close)
            VALUES ${moreSql.substring(0, moreSql.length - 1)}
            ON DUPLICATE KEY UPDATE open = VALUES(open), close = VALUES(close)`;
        eta.db.query(sql, params, (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({ "raw": "true" });
        });
    }
}
