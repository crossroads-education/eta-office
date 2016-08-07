import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let fields : string[] = ["altEmail", "badgeName", "biography",
            "emergencyName", "emergencyPhone", "emergencyRelationship",
            "international", "maxHours", "minHours", "notes",
            "phone", "shirt", "hoodie", "workStudy"];
        let sql : string = "UPDATE Employee SET ";
        let params : string[] = [];
        for (let i : number = 0; i < fields[i].length; i++) {
            sql += fields[i] + " = ?,";
            params.push(req.body[fields[i]]);
        }
        sql = sql.slice(0, -1) + " WHERE id = ? AND current = 1";
        params.push(req.session["userid"]);
        eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            callback({"raw": "[true]"});
        });
    }
}
