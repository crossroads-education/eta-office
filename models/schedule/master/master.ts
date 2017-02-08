import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let os: string = eta.http.getUserAgent(req).os.family;
        if (os.indexOf("Android") !== -1 || os.indexOf("iOS") !== -1 || os.indexOf("Windows Phone") !== -1) {
            // mobile
            res.redirect("/office/schedule/master/mobile");
        } else {
            // desktop
            res.redirect("/office/schedule/master/desktop");
        }
    }
}
