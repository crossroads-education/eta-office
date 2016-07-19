import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let positions : string[] = [];
        let categories : string[] = [];
        var sql : string = "SELECT `name`, `category` FROM `Position` WHERE `active`=1;";
        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            for (var i in rows) {
                if (positions.indexOf(rows[i].name) === -1) {
                    positions.push(rows[i].name);
                }
                if (categories.indexOf(rows[i].category) === -1) {
                    categories.push(rows[i].category);
                }
            }
            for (var i in positions) {
                positions[i] = positions[i].replace(/\-LEVEL/g, "");
            }
            positions.sort();
            categories.sort();
            callback({
                "positions": positions,
                "categories": categories
            });
        });
    }
}
