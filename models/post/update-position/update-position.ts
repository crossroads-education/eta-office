import * as eta from "eta-lib";
import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        eta.logger.json(req.body)
        let sql: string = `
            UPDATE
                Position
            SET
                active = ?,
                open = ?,
                visible = ?
            WHERE id = ?`;
        eta.db.query(sql, [req.body.active === "true", req.body.open === "true", req.body.visible === "true", req.body.id], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            callback({ "raw": "true" });
        })
    }
}
