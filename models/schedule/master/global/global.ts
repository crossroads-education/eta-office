import * as eta from "eta-lib";

import * as express from "express";
import HelperSchedule from "../../../../lib/helpers/HelperSchedule";
import ScheduleFilterOptions from "../../../../lib/interfaces/ScheduleFilterOptions";

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
            let allHours: string[] = eta.time.fillTimes(open, close, eta.time.span1Hour, "ht");
            allHours.splice(allHours.length - 1, 1); // Remove last
            eta.position.getAllNames(req.session["department"], (err: Error, names: string[]) => {
                if (err) {
                    eta.logger.error(err);
                    return callback({ errcode: eta.http.InternalError });
                }
                eta.position.getAllCategories(req.session["department"], (err: Error, categories: string[]) => {
                    if (err) {
                        eta.logger.error(err);
                        return callback({ errcode: eta.http.InternalError });
                    }
                    callback({
                        "canEdit": req.session["permissions"].has("edit/schedule/master"),
                        "positionNames": names,
                        "positionCategories": categories,
                        "scheduleHours": allHours
                    });
                });
            });
        });
    }
}
