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
            let terms : eta.Term[] = eta.object.copy(eta.term.terms);
            for (let i : number = 0; i < terms.length; i++) {
                if (terms[i].term.endsWith("5")) {
                    if (terms[i].session == "1") {
                        terms.splice(i, 1);
                        i--;
                    } else {
                        terms[i].name += ` (${terms[i].session})`;
                    }
                }
            }
            callback({
                "schedulePositionNames": rows[0].names.split(","),
                "schedulePositionCategories": rows[0].categories.split(","),
                "scheduleTerms": terms,
                "scheduleMode": req.query.edit ? "edit" : "view",
                "permissions": req.session["permissions"]
            });
        });
    }
}
