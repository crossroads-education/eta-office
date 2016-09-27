import * as eta from "eta-lib";
import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = `
        SELECT DISTINCT
            Position.name,
            Position.open
        FROM
            Position
                LEFT JOIN Center ON
                    Position.center = Center.id
        WHERE
            Position.active = 1 AND
            Position.category != "Management" AND
            Center.department = ?`;
        eta.db.query(sql, [req.session["department"]], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({ positions: rows });
        });
    }
}
