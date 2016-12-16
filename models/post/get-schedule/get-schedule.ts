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
                let missingSlots: number = Number(((slotTime.getTime() - lastTime.getTime()) / eta.time.span15Minutes - 1).toFixed(0));
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
                }
                lastTime = slotTime;
            }
            eta.center.getLongestHoursForDay(req.body.day, req.body.term, (err: Error, hours?: eta.HoursOfOperation) => {
                if (err) {
                    eta.logger.dbError(<any>err);
                    return callback({ errcode: eta.http.InternalError });
                }
                if (!hours) {
                    return callback({ errcode: eta.http.NotFound });
                }
                function fillMissingTimes(open: string, slotTime: string): schedule.Slot[] {
                    let slots: schedule.Slot[] = [];
                    if (open != slotTime) {
                        let slotTimeFill: Date = new Date(eta.time.getDateFromTime(slotTime).getTime() - eta.time.span15Minutes);
                        let times: string[] = eta.time.fillTimes(eta.time.getDateFromTime(open), slotTimeFill, eta.time.span15Minutes, "HH:MM:ss");
                        for (let i: number = 0; i < times.length; i++) {
                            slots.push({
                                "time": times[i],
                                "center": -1,
                                "isAvailable": false
                            });
                        }
                    }
                    return slots;
                }
                slots = fillMissingTimes(hours.open, slots[0].time).concat(slots);
                slots = slots.concat(fillMissingTimes(slots[slots.length - 1].time, hours.close));
                callback({ raw: JSON.stringify(slots) });
            });
        });
    }
}
