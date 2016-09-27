import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        // TODO: Implement department-specific reports, or disable when not MAC
        if (req.session["department"] !== 1) {
            callback({ errcode: eta.http.Forbidden });
            return;
        }
        let sql: string = `
            SELECT DISTINCT
                Position.name
            FROM
                Position
            ORDER BY Position.name`;
        eta.db.query(sql, [], (err: eta.DBError, positionNames: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            sql = "SELECT * FROM Department ORDER BY Department.id";
            eta.db.query(sql, [], (err: eta.DBError, departments: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                callback({
                    "currentTerm": eta.term.getCurrent().id,
                    "departments": departments,
                    "positionNames": positionNames,
                    "terms": eta.term.getClosest(eta.term.getCurrent())
                });
            });
        });
    }
}
