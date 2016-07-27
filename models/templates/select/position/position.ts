import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        eta.db.query("SELECT DISTINCT name FROM Position WHERE active = 1", [], (err : eta.DBError, nameRows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            eta.db.query("SELECT DISTINCT category FROM Position WHERE active = 1", [], (err : eta.DBError, categoryRows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                let names : string[] = [];
                for (let i : number = 0; i < nameRows.length; i++) {
                    names.push(nameRows[i].name);
                }
                let categories : string[] = [];
                for (let i : number = 0; i < categoryRows.length; i++) {
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
