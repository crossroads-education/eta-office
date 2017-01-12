import * as eta from "eta-lib";

import * as express from "express";
import HelperSchedule from "../../../../lib/helpers/HelperSchedule";
import ScheduleFilterOptions from "../../../../lib/interfaces/ScheduleFilterOptions";
import ScheduleRow from "../../../../lib/interfaces/ScheduleRow";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let options: ScheduleFilterOptions = HelperSchedule.getFilterOptions(req);
        eta.center.getLongestHoursForAllDays(options.term, (err: Error, hours: { [key: number]: eta.HoursOfOperation }) => {
            if (err) {
                eta.logger.error(err);
                return callback({ errcode: eta.http.InternalError });
            }
            HelperSchedule.getAllForEmployee(req.session["department"], options.term, options.employee, hours, (err: Error, rows: ScheduleRow[]) => {
                if (err) {
                    eta.logger.error(err);
                    return callback({ errcode: eta.http.InternalError });
                }
                callback({
                    "scheduleRows": rows
                });
            });
        });
    }
}
