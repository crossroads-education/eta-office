import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!req.query.term) {
            req.query.term = eta.term.getCurrent().id;
        }
        let positions: string[] = [];
        let categories: string[] = [];
        var sql: string = `
            SELECT
                GROUP_CONCAT(DISTINCT Position.name ORDER BY Position.name) AS names,
                GROUP_CONCAT(DISTINCT Position.category ORDER BY Position.category) AS categories
            FROM
                Position
                    LEFT JOIN Center ON
                        Position.center = Center.id
            WHERE
                Position.active = 1 AND
                Center.department = ?`;
        eta.db.query(sql, [req.session["department"]], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                return callback({ errcode: eta.http.InternalError });
            }
            let terms: eta.Term[] = eta.term.getClosest(eta.term.get(req.query.term));
            for (let i: number = 0; i < terms.length; i++) {
                if (terms[i].session != "1") {
                    terms[i].name += ` (${terms[i].session})`;
                }
            }
            eta.center.getAll((centers: eta.Center[]) => {
                if (!centers) {
                    return callback({ errcode: eta.http.InternalError });
                }
                let legend: { [key: string]: string } = {};
                for (let i: number = 0; i < centers.length; i++) {
                    if (centers[i].capacity > 0 && centers[i].department == req.session["department"]) {
                        legend[centers[i].code] = centers[i].shorthand;
                    }
                }
                callback({
                    "daysOfWeek": eta.time.daysOfWeek,
                    // "scheduleLegend": legend,
                    "schedulePositionNames": rows[0].names.split(","),
                    "schedulePositionCategories": rows[0].categories.split(","),
                    "scheduleTerms": terms,
                    "scheduleMode": req.query.edit ? "edit" : "view",
                    "permissions": req.session["permissions"]
                });
            });
        });
    }
}
