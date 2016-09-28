import * as eta from "eta-lib";

import * as express from "express";
import * as fs from "fs";

export class Model implements eta.Model {

    private params: eta.ModelParams;

    public setParams(params: eta.ModelParams): void {
        this.params = params;
    }

    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let navbarData: any = JSON.parse(fs.readFileSync(eta.server.modules["office"].dirs.models + "navbar.json").toString());
        let navbarHTML: string = eta.navbar.build(navbarData, req.session["permissions"], this.params.baseUrl, false);
        callback({
            "navbarHTML": navbarHTML
        });
    }
}
