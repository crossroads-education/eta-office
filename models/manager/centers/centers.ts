import * as eta from "eta-lib";

import * as express from "express";

interface HoursOfOperation {
    open : string;
    close : string;
    day : number;
    name : string;
}

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!req.query.term) {
            req.query.term = eta.term.getCurrent(true).id;
        }
        if (!req.query.center) {
            req.query.center = eta.setting.get("/center", "main").value;
        }
        let sql : string = `
            SELECT
                day,
                open,
                close
            FROM
                HoursOfOperation
            WHERE
                term = ? AND
                center = ?
            ORDER BY day ASC`;
        eta.db.query(sql, [req.query.term, req.query.center], function(err : eta.DBError, rows : any[]) {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            let centers : HoursOfOperation[] = [];
            for (let i : number = 0; i < rows.length; i++) {
                centers[rows[i].day] = rows[i];
            }
            for (let i : number = 0; i < eta.time.daysOfWeek.length; i++) {
                if (!centers[i]) { // does not exist
                    centers[i] = {
                        "open": "",
                        "close": "",
                        "day": i,
                        "name": eta.time.daysOfWeek[i]
                    }
                } else {
                    centers[i].name = eta.time.daysOfWeek[rows[i].day];
                }
            }
            let terms : eta.Term[] = eta.term.getClosest(eta.term.get(req.query.term), true);
            callback({
                "currentCenter": req.query.center,
                "currentTerm": req.query.term,
                "selectTerms": terms,
                "hours": centers
            });
        });
    }
}
