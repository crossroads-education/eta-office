import * as eta from "eta-lib";

import * as express from "express";
import HelperSchedule from "../../../../lib/helpers/HelperSchedule";
import ScheduleFilterOptions from "../../../../lib/interfaces/ScheduleFilterOptions";
import ScheduleRow from "../../../../lib/interfaces/ScheduleRow";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        // let userid: string = req.session["userid"];
        // if (req.query.userid) {
        //     userid = req.query.userid;
        // }
        let options: ScheduleFilterOptions = HelperSchedule.getFilterOptions(req);
        eta.center.getLongestHoursForWeek(options.term, (err: Error, hours: eta.HoursOfOperation) => {
            if (err) {
                eta.logger.error(err);
                return callback({ errcode: eta.http.InternalError });
            }
            let open: Date = eta.time.getDateFromTime(hours.open);
            let close: Date = eta.time.getDateFromTime(hours.close);
            close.setMinutes(close.getMinutes() - 15);
            let allHours: string[] = eta.time.fillTimes(open, close, eta.time.span1Hour, "ht");
            eta.center.getLongestHoursForAllDays(options.term, (err: Error, allDayHours: { [key: number]: eta.HoursOfOperation }) => {
                if (err) {
                    eta.logger.error(err);
                    return callback({ errcode: eta.http.InternalError });
                }
                HelperSchedule.getAllForEmployee(req.session["department"], options.term, options.employee, allDayHours, (err: Error, rows: ScheduleRow[]) => {
                    if (err) {
                        eta.logger.error(err);
                        return callback({ errcode: eta.http.InternalError });
                    }
                    callback({
                        "canEdit": req.session["userid"] == options.employee,
                        "scheduleHours": allHours,
                        "scheduleRows": rows
                    });
                });
            });
        });
    }
}
