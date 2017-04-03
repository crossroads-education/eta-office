import * as eta from "eta-lib";

import * as express from "express";
import * as fs from "fs";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.query, ["term"])) {
            return callback({errcode: eta.http.InvalidParameters});
        }
        if (req.query.term.length < 2) {
            return callback({errcode: eta.http.Success});
        }
        let sql: string = `
            SELECT
                Course.id,
                CONCAT(Course.subject, ' ', Course.number) AS text
            FROM
                Course
            WHERE
                Course.subject REGEXP ? OR
                Course.number REGEXP ? OR
                CONCAT(Course.subject, ' ', Course.number) REGEXP ?
            ORDER BY
                Course.subject,
                Course.number`;
        eta.db.query(sql, [req.query.term, req.query.term, req.query.term], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.error(err);
                return callback({errcode: eta.http.InternalError});
            }
            res.header("Content-Type", "application/json");
            return callback({
                "raw": JSON.stringify({
                    results: rows
                })
            });
        });
    }
}
