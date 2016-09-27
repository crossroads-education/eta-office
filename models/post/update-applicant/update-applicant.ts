import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["userid", "flags"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let flags: { [key: string]: any } = JSON.parse(req.body.flags);
        let sql: string = "UPDATE Applicant SET ";
        let params: string[] = [];
        for (let name in flags) {
            sql += name + " = ?,";
            params.push(flags[name]);
        }
        sql = sql.substring(0, sql.length - 1) + " WHERE id = ?";
        params.push(req.body.userid);
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
