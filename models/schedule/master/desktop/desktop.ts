import * as eta from "eta-lib";

import * as express from "express";
import HelperSchedule from "../../../../lib/helpers/HelperSchedule";
import ScheduleFilterOptions from "../../../../lib/interfaces/ScheduleFilterOptions";
import ScheduleRow from "../../../../lib/interfaces/ScheduleRow";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let options: ScheduleFilterOptions = HelperSchedule.getFilterOptions(req);
        eta.center.getLongestHoursForDay(options.day, options.term, (err: Error, hours: eta.HoursOfOperation) => {
            if (err) {
                eta.logger.error(err);
                return callback({ errcode: eta.http.InternalError });
            }
            let open: Date = eta.time.getDateFromTime(hours.open);
            let close: Date = eta.time.getDateFromTime(hours.close);
            close.setMinutes(close.getMinutes() - 15);
            HelperSchedule.getAllForDay(req.session["department"], options.term, options.day, open, close, options.edit, (err: Error, rows: ScheduleRow[]) => {
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
