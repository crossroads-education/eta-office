import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["userid"])) {
            return callback({ errcode: eta.http.InvalidParameters });
        }
        let sql: string = `
            SELECT
                ApplicantEvaluation.level AS position,
                ApplicantEvaluation.date,
                ApplicantEvaluation.score
            FROM
                ApplicantEvaluation
            WHERE
                ApplicantEvaluation.id = ?`;
        eta.db.query(sql, [req.body.userid], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                return callback({ errcode: eta.http.InternalError });
            }
            callback({
                "raw": JSON.stringify(rows)
            });
        });
    }
}
