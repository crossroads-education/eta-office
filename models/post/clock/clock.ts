import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        eta.logger.json(req.session);
        if(req.session["needsClockIn"] == true){
            let sql : string = "INSERT INTO EmployeeTimesheet (id, ipIn, ipOut, timeIn, timeOut) VALUES (?, ?, NULL, NOW(), NULL) ";
            eta.db.query(sql, [req.session["userid"], req.ip], (err : eta.DBError, rows : any[]) => {
                if(err) {
                    eta.logger.dbError(err);
                    callback({errcode : eta.http.InternalError});
                    return;
                }
                req.session["needsClockIn"] = false;
                callback({raw: "in"})
            })
        }else
        {
            let sql : string = "UPDATE EmployeeTimesheet SET timeOut = NOW(), ipOut = ? WHERE DATE(timeIn) = CURDATE() AND id = ? AND timeOut IS NULL";
            eta.db.query(sql, [req.ip, req.session["userid"]], (err : eta.DBError, rows : any[]) => {
                if(err) {
                    eta.logger.dbError(err);
                    callback({errcode : eta.http.InternalError});
                    return;
                }
                req.session["needsClockIn"] = true;
                callback({raw: "out"})
            })
        }


    }
}
