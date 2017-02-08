import * as eta from "eta-lib";

import * as express from "express";
import HelperSchedule from "../../../lib/helpers/HelperSchedule";
import ScheduleFilterOptions from "../../../lib/interfaces/ScheduleFilterOptions";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let options: ScheduleFilterOptions = HelperSchedule.getFilterOptions(req);
        let terms: eta.Term[] = eta.term.getClosest(eta.term.get(options.term), false, 2);
        callback({
            "currentFilters": options,
            "daysOfWeek": eta.time.daysOfWeek,
            "terms": terms
        });
    }
}
