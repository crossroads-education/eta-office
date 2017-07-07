import * as eta from "eta-lib";

import * as fs from 'fs';

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!eta.params.test(req.body, ["id", "file"])) {
            callback({ errcode: eta.http.InvalidParameters });
            return;
        }

        // delete the file from id folder

    }
}
