import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["userid", "level", "date", "score"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let sql: string = `
            INSERT INTO ApplicantEvaluation (id, level, date, score)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE score = VALUES(score)`;
        eta.db.query(sql, [req.body.userid, req.body.level, req.body.date, req.body.score], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({ "raw": "true" });
        });
    }
}
