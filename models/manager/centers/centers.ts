import * as eta from "eta-lib";

import * as express from "express";

interface HoursOfOperation {
    open: string;
    close: string;
    day: number;
    name: string;
}

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!req.query.term) {
            req.query.term = eta.term.getCurrent().id;
        }
        if (!req.query.center) {
            req.query.center = eta.setting.get("/center", "main").value;
        }
        let sql: string = `
            SELECT
                HoursOfOperation.day,
                HoursOfOperation.open,
                HoursOfOperation.close
            FROM
                HoursOfOperation
                    LEFT JOIN Center ON
                        HoursOfOperation.center = Center.id
            WHERE
                HoursOfOperation.term = ? AND
                HoursOfOperation.center = ? AND
                Center.department = ?
            ORDER BY day ASC`;
        eta.db.query(sql, [req.query.term, req.query.center, req.session["department"]], function(err: eta.DBError, rows: any[]) {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            let centers: HoursOfOperation[] = [];
            for (let i: number = 0; i < rows.length; i++) {
                centers[rows[i].day] = rows[i];
            }
            for (let i: number = 0; i < eta.time.daysOfWeek.length; i++) {
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
            let terms: eta.Term[] = eta.term.getClosest(eta.term.get(req.query.term));
            callback({
                "currentCenter": req.query.center,
                "currentTerm": req.query.term,
                "selectTerms": terms,
                "hours": centers
            });
        });
    }
}
