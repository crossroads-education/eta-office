import * as eta from "eta-lib";

import * as express from "express";
import * as schedule from "node-schedule";

export class Model implements eta.Model {

    private onDatabaseQuery(err : eta.DBError, rows : any[]) : void {
        if (err) {
            eta.logger.dbError(err);
        }
        eta.logger.trace("Job complete.");
    }

    private updateEmployeeCurrent() : void {
        let sql : string = `
            SELECT
                EmployeePosition.*
            FROM
                EmployeePosition
                    LEFT JOIN Employee ON
                        EmployeePosition.id = Employee.id
            WHERE
                Employee.current = 1`;
        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                return;
            }
            let ids : string[] = [];
            let goodIDs : {[key : string] : boolean} = {};
            for (let i : number = 0; i < rows.length; i++) {
                if (goodIDs[rows[i].id]) {
                    continue;
                }
                if (rows[i].end === null || rows[i].end.getTime() > (new Date()).getTime()) {
                    goodIDs[rows[i].id] = true;
                }
                if (ids.indexOf(rows[i].id) === -1) {
                    ids.push(rows[i].id);
                }
            }
            let badIDs : string[] = [];
            for (let i : number = 0; i < ids.length; i++) {
                if (!goodIDs[ids[i]]) {
                    badIDs.push(ids[i]);
                }
            }
            if (badIDs.length === 0) {
                return;
            }
            sql = `
                UPDATE
                    Employee
                SET
                    current = 0
                WHERE
                    id IN (?)`;
            eta.db.query(sql, badIDs, this.onDatabaseQuery);
        });
    }

    public onScheduleInit() : void {
        schedule.scheduleJob("0 0 2 * * *", () => {
            this.updateEmployeeCurrent();
        });
    }

    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        this.updateEmployeeCurrent();
        callback({"errcode": 200})
    }
}
