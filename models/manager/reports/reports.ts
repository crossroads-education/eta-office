import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        // TODO: Implement department-specific reports, or disable when not MAC
        if (req.session["department"] !== 1) {
            return callback({ errcode: eta.http.Forbidden });
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
                return callback({ errcode: eta.http.InternalError });
            }
            sql = "SELECT * FROM Department ORDER BY Department.id";
            eta.db.query(sql, [], (err: eta.DBError, departments: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    return callback({ errcode: eta.http.InternalError });
                }
                sql = `
                    SELECT DISTINCT
                        Course.tutor AS levelName
                    FROM
                        Course
                    WHERE
                        Course.tutor IS NOT NULL
                    ORDER BY
                        Course.tutor ASC`;
                eta.db.query(sql, [], (err: eta.DBError, tutorLevels: any[]) => {
                    if (err) {
                        eta.logger.dbError(<any>err);
                        return callback({ errcode: eta.http.InternalError });
                    }
                    eta.center.getAll((centers: eta.Center[]) => {
                        if (!centers) {
                            return callback({ errcode: eta.http.InternalError });
                        }
                        callback({
                            "centers": centers,
                            "currentTerm": eta.term.getCurrent().id,
                            "departments": departments,
                            "positionNames": positionNames,
                            "terms": eta.term.getClosest(eta.term.getCurrent(), false, 2),
                            "tutorLevels": tutorLevels
                        });
                    });
                });
            });
        });
    }
}
