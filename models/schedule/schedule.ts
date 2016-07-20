import * as eta from "eta-lib";
import * as schedule from "../../lib/templates/Schedule";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let rows : schedule.Row[] = [];
        let filters : {[key : string] : any} = req.query; // filterable names should be the same as GET parameter names
        if (!filters["term"]) {
            filters["term"] = eta.term.getCurrent().id;
        }
        if (!filters["center"]) {
            filters["center"] = eta.setting.get("/center", "main").value;
        }
        if (!filters["day"]) {
            filters["day"] = new Date().getDay();
        }
        let sql : string = `
            SELECT
                EmployeeSchedule.*,
                Center.code AS centerCode,
                HOUR(EmployeeSchedule.time) AS hour,
                MINUTE(EmployeeSchedule.time) AS minute,
                TotalHours.totalHours,
                Person.firstName,
                Person.lastName
            FROM
                EmployeeSchedule
                    LEFT JOIN Center ON
                        EmployeeSchedule.center = Center.id
                    LEFT JOIN Person ON
                        EmployeeSchedule.id = Person.id
                    LEFT JOIN (
                        SELECT
                            id, term, day,
                            COUNT(*) / 4 as totalHours
                        FROM
                            EmployeeSchedule
                        GROUP BY id, term, day
                    ) AS TotalHours ON
                        EmployeeSchedule.id = TotalHours.id AND
                        EmployeeSchedule.term = TotalHours.term AND
                        EmployeeSchedule.day = TotalHours.day
            WHERE
                EmployeeSchedule.term = ? AND
                EmployeeSchedule.day = ?
            ORDER BY
                EmployeeSchedule.id,
                EmployeeSchedule.day,
                EmployeeSchedule.time`;
        eta.db.query(sql, [filters["term"], filters["day"]], (err : eta.DBError, raw : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            sql = `
                SELECT
                    EmployeePosition.id,
                    GROUP_CONCAT(DISTINCT Position.name) AS names,
                    GROUP_CONCAT(DISTINCT Position.category) AS categories
                FROM
                    EmployeePosition
                        LEFT JOIN Position ON
                            EmployeePosition.position = Position.id
                        LEFT JOIN Term ON
                            Term.id = ?
                WHERE
                    EmployeePosition.start <= Term.end AND
                    (
                        EmployeePosition.end >= Term.start OR
                        ISNULL(EmployeePosition.end)
                    )
                GROUP BY EmployeePosition.id
            `;
            eta.db.query(sql, [filters["term"]], (err : eta.DBError, positionRows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                sql = `
                    SELECT
                        HOUR(open) AS open,
                        HOUR(close) AS close
                    FROM
                        HoursOfOperation
                    WHERE
                        term = ? AND
                        center = ? AND
                        day = ?
                    LIMIT 1 -- just in case
                `;
                eta.db.query(sql, [filters["term"], filters["center"], filters["day"]], (err : eta.DBError, hourRows : any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({errcode: eta.http.InternalError});
                        return;
                    }
                    let hours : {open : number, close : number} = hourRows[0];
                    let openHourDate : Date = new Date();
                    openHourDate.setHours(hours["open"]);
                    let closeHourDate : Date = new Date();
                    closeHourDate.setHours(hours["close"]);
                    let allHoursOpen : string[] = eta.time.fillTimes(openHourDate, closeHourDate, eta.time.span1Hour, "ht");
                    for (let i : number = 0; i < raw.length; i++) {
                        let rowIndex : number = -1;
                        for (let k : number = 0; k < rows.length; k++) {
                            if (rows[k].userid == raw[i].id) {
                                rowIndex = k;
                                break;
                            }
                        }
                        if (rowIndex == -1) { // set up new row
                            let positionIndex : number = -1;
                            for (let k : number = 0; k < positionRows.length; k++) {
                                if (positionRows[k].id == raw[i].id) {
                                    positionIndex = k;
                                }
                            }
                            if (positionIndex == -1) {
                                continue;
                            }
                            rowIndex = rows.length;
                            rows.push({
                                "userid": raw[i].id,
                                "label": raw[i].firstName + " " + raw[i].lastName,
                                "filterables": {
                                    "data-position-names": positionRows[positionIndex].names.split(","),
                                    "data-position-categories": positionRows[positionIndex].categories.split(",")
                                },
                                "total": raw[i].totalHours,
                                "slots": []
                            });
                        }
                        let hourIndex : number = raw[i].hour - hours["open"];
                        let minuteIndex : number = Math.floor(raw[i].minute / 15);
                        if (!rows[rowIndex].slots[hourIndex]) {
                            rows[rowIndex].slots[hourIndex] = [];
                        }
                        rows[rowIndex].slots[hourIndex][minuteIndex] = {
                            "isAvailable": raw[i].isAvailable == 1,
                            "center": raw[i].centerCode ? raw[i].centerCode : "UV",
                            "time": raw[i].time
                        };
                    }
                    eta.center.getAll((centers : eta.Center[]) => {
                        if (centers == null) {
                            callback({errcode: eta.http.InternalError});
                            return;
                        }
                        let locationPalette : {[key : string] : string} = {};
                        for (let i : number = 0; i < centers.length; i++) {
                            if (centers[i].address != "") {
                                locationPalette[centers[i].shorthand] = centers[i].code;
                            }
                        }
                        for (let i : number = 0; i < rows.length; i++) {
                            for (let k : number = 0; k < hours["close"] - hours["open"]; k++) {
                                if (!rows[i].slots[k]) {
                                    // eta.logger.warn(`Slot [${i}][${k}] is non-existent! (${rows[i].slots[k]})`);
                                    rows[i].slots[k] = [];
                                }
                                for (let j : number = 0; j < 4; j++) {
                                    if (!rows[i].slots[k][j]) {
                                        rows[i].slots[k][j] = {
                                            "center": -1,
                                            "isAvailable": false,
                                            "time": `${k + hours["open"]}:${j == 0 ? "00" : j * 15}:00`
                                        };
                                    }
                                }
                            }
                        }
                        callback({
                            "scheduleRowType": "person", // each row represents a person in the master schedule
                            "scheduleFilters": filters,
                            "scheduleRows": rows,
                            "scheduleMode": req.query.edit ? "manager" : "view",
                            "scheduleHours": allHoursOpen,
                            "scheduleLocationPalette": locationPalette
                        });
                    });
                });
            });
        });
    }
}
