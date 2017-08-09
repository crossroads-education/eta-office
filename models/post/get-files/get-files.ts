import * as eta from "eta-lib";

import * as fs from 'fs';

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        // Pull the files from each employees' directory
        let employeeFiles: string[][] = [];
        let dir: string = eta.server.modules["office"].baseDir + "static/files/employee-files/";

        let fileDir: string = dir + req.body.id + "/";
        let files: string[] = []
            try {
                files = fs.readdirSync(fileDir);
                callback({ "raw": JSON.stringify(files) });
            } catch (err) {
                if(err.code === 'ENOENT') {
                    files = []
                } else {
                    eta.logger.error(err);
                    callback({ errcode: eta.http.InternalError });
                }
            }
        }
    }
