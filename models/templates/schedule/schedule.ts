import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let positions : string[] = [];
        let categories : string[] = [];
        var sql : string = `
            SELECT
                GROUP_CONCAT(DISTINCT Position.name ORDER BY Position.name) AS names,
                GROUP_CONCAT(DISTINCT Position.category ORDER BY Position.category) AS categories
            FROM
                Position
            WHERE
                Position.active = 1
        `;
        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            callback({
                "schedulePositionNames": ("All," + rows[0].names).split(","),
                "schedulePositionCategories": ("All," + rows[0].categories).split(","),
                "scheduleTerms": eta.term.terms,
                "scheduleMode": req.query.edit ? "edit" : "view",
                "permissions": req.session["permissions"]
            });
        });
    }
}
