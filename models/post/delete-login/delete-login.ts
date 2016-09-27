import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["name"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let sql: string = "DELETE FROM LoginData WHERE name = ?";
        eta.db.query(sql, [req.body.name], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({ "raw": "true" });
        });
    }
}
