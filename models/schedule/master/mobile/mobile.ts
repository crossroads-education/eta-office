import * as eta from "eta-lib";

import * as express from "express";
import HelperSchedule from "../../../../lib/helpers/HelperSchedule";
import ScheduleFilterOptions from "../../../../lib/interfaces/ScheduleFilterOptions";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let options: ScheduleFilterOptions = HelperSchedule.getFilterOptions(req);
        callback({});
    }
}
