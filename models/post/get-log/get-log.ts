import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["userid"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let sql: string = `
            SELECT
                CONCAT(AuthorPerson.firstName, ' ', AuthorPerson.lastName) AS author,
                Log.timestamp,
                Log.message,
                Log.type
            FROM
                Log
                    LEFT JOIN Person AuthorPerson ON
                        Log.author = AuthorPerson.id
            WHERE
                Log.about = ?
            ORDER BY Log.timestamp`;
        eta.db.query(sql, [req.body.userid], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({
                "raw": JSON.stringify(rows)
            });
        });
    }
}
