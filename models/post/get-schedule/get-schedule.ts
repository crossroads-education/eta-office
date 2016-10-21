import * as eta from "eta-lib";

import * as express from "express";
import * as schedule from "../../../lib/templates/Schedule";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["id", "term", "day"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }
        let sql: string = `
            SELECT
                EmployeeSchedule.time,
                EmployeeSchedule.center,
                EmployeeSchedule.isAvailable
            FROM
                EmployeeSchedule
            WHERE
                EmployeeSchedule.id = ? AND
                EmployeeSchedule.term = ? AND
                EmployeeSchedule.day = ?`;
        eta.db.query(sql, [req.body.id, req.body.term, req.body.day], (err: eta.DBError, slots: schedule.Slot[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            let lastTime: Date = new Date(); // current time will always be greater than result of getDateFromTime()
            for (let i: number = 0; i < slots.length; i++) {
                let slotTime: Date = eta.time.getDateFromTime(slots[i].time);
                let missingSlots: number = (slotTime.getTime() - lastTime.getTime()) / eta.time.span15Minutes - 1;
                if (missingSlots > 0) { // difference is greater than 15 minutes
                    // there's a missing slot in between the last slot and this one
                    let params: any[] = [i, 0];
                    // doing this because fillTimes() is inclusive and we don't need that
                    let newLastTime: Date = new Date(lastTime.getTime() + eta.time.span15Minutes);
                    let newSlotTime: Date = new Date(slotTime.getTime() - eta.time.span15Minutes);
                    let times: string[] = eta.time.fillTimes(newLastTime, newSlotTime, eta.time.span15Minutes, "HH:MM:ss");
                    for (let k: number = 0; k < missingSlots; k++) {
                        params.push(<schedule.Slot>{
                            "time": times[k],
                            "center": -1,
                            "isAvailable": false
                        });
                    }
                    Array.prototype.splice.apply(slots, params);
                    i += missingSlots;
                }
                lastTime = slotTime;
            }
            callback({ raw: JSON.stringify(slots) });
        });
    }
}
