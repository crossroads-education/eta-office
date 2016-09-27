import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = `
            SELECT DISTINCT
                Position.name
            FROM
                Position
                    LEFT JOIN Center ON
                        Position.center = Center.id
            WHERE
                Position.active = 1 AND
                Center.department = ?`;
        eta.db.query(sql, [req.session["department"]], (err: eta.DBError, nameRows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            sql = `
                SELECT DISTINCT
                    Position.category
                FROM
                    Position
                        LEFT JOIN Center ON
                            Position.center = Center.id
                WHERE
                    Position.active = 1 AND
                    Center.department = ?`;
            eta.db.query(sql, [req.session["department"]], (err: eta.DBError, categoryRows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                let names: string[] = [];
                for (let i: number = 0; i < nameRows.length; i++) {
                    names.push(nameRows[i].name);
                }
                let categories: string[] = [];
                for (let i: number = 0; i < categoryRows.length; i++) {
                    categories.push(categoryRows[i].category);
                }
                callback({
                    "selectPositionNames": names,
                    "selectPositionCategories": categories
                });
            });
        });
    }
}
