import * as eta from "eta-lib";

import * as express from "express";
import * as fs from "fs";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!eta.params.test(req.body, ["reportName", "jsonParams"])) {
            callback({errcode: eta.http.InvalidParameters});
            return;
        }
        let jsonParams : string[] = JSON.parse(req.body.jsonParams);
        for (let i : number = 0; i < jsonParams.length; i++) {
            let param : any = req.body[jsonParams[i]];
            if (param) {
                req.body[jsonParams[i]] = JSON.parse(param);
            }
        }
        let sqlFilename : string = "modules/office/lib/reports/" + req.body.reportName + ".sql";
        eta.fs.exists(sqlFilename, (exists : boolean) => {
            if (!exists) {
                callback({errcode: eta.http.NotFound});
                return;
            }
            fs.readFile(sqlFilename, (err : NodeJS.ErrnoException, buffer : Buffer) => {
                if (err) {
                    eta.logger.warn("Could not read file: " + err.message);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                let params : string[] = [];
                let sql : string = buffer.toString();
                // params list is CSV comment at the top of the file
                if (sql.startsWith("-- ")) {
                    let rawParams : string[] = sql.split("\n")[0].substring(3).replace(/\r/g, "").split(",");
                    for (let i : number = 0; i < rawParams.length; i++) {
                        let param : string = req.body[rawParams[i]];
                        if (!param) {
                            eta.logger.warn("Missing parameter " + JSON.stringify(rawParams[i]));
                            callback({errcode: eta.http.InvalidParameters});
                            return;
                        }
                        params.push(param);
                    }
                }
                eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({errcode: eta.http.InternalError});
                        return;
                    }
                    callback({"raw": JSON.stringify(rows)});
                });
            });
        });
    }
}
