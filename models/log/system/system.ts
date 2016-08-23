import * as eta from "eta-lib";

import * as express from "express";
import * as fs from "fs";

interface Log {
    time : string;
    source : string;
    severity : string;
    message : string;
}

function parseLogLine(line : string) : Log {
    // format: (hh:MM:SS tt) [source] [severity] message
    let time : string = line.split(")")[0].substring(1);
    let source : string = line.split("]")[0].split("[")[1];
    let severity : string = line.split("]")[1].split("[")[1];
    let message : string = line.split("]").splice(2).join("]");
    return {
        "time": time,
        "source": source,
        "severity": severity,
        "message": message
    };
}

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!req.body.date) {
            req.body.date = eta.time.getStandardDate(new Date());
        }
        let logFile : string = `logs/${req.body.date}.log`;
        eta.fs.exists(logFile, (exists : boolean) => {
            if (!exists) {
                callback({errcode: eta.http.NotFound});
                return;
            }
            fs.readFile(logFile, (err : NodeJS.ErrnoException, buffer : Buffer) => {
                if (err) {
                    eta.logger.warn(err.message);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                let lines : string[] = buffer.toString().split("\n");
                let logs : Log[] = [];
                for (let i : number = 0; i < lines.length; i++) {
                    let line : string = lines[i].replace(/\r/g, "");
                    try {
                        logs.push(parseLogLine(line));
                    } catch (ex) {
                        logs[logs.length - 1].message += "\n" + line;
                    }
                }
                callback({
                    "logs": logs
                });
            });
        });
    }
}
