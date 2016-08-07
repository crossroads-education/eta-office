import * as eta from "eta-lib";
import * as schedule from "../../lib/templates/Schedule";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (req.query.edit && !req.session["permissions"].has("edit/schedule/master")) {
            callback({errcode: eta.http.Forbidden});
            return;
        }
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
        if (!filters["sort"]) {
            filters["sort"] = "name";
        }
        let sql : string = `
            SELECT
                EmployeeSchedule.*,
                Center.code AS centerCode,
                HOUR(EmployeeSchedule.time) AS hour,
                MINUTE(EmployeeSchedule.time) AS minute,
                DayTotal.totalHours AS dayHours,
                WeekTotal.totalHours AS weekHours,
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
                            COUNT(*) / 4 AS totalHours
                        FROM
                            EmployeeSchedule
                        WHERE
                            center != -1
                        GROUP BY id, term, day
                    ) AS DayTotal ON
                        EmployeeSchedule.id = DayTotal.id AND
                        EmployeeSchedule.term = DayTotal.term AND
                        EmployeeSchedule.day = DayTotal.day
                    LEFT JOIN (
                        SELECT
                            id, term,
                            COUNT(*) / 4 AS totalHours
                        FROM
                            EmployeeSchedule
                        WHERE
                            center != -1
                        GROUP BY id, term
                    ) AS WeekTotal ON
                        EmployeeSchedule.id = WeekTotal.id AND
                        EmployeeSchedule.term = WeekTotal.term
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
                        if (raw[i].hour >= hours.close || raw[i].open < hours.open) {
                            continue;
                        }
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
                                "weekTotal": raw[i].weekHours ? raw[i].weekHours : 0,
                                "dayTotal": raw[i].dayHours ? raw[i].dayHours : 0,
                                "slots": [],
                                "isAvailable": false,
                                "isScheduled": false
                            });
                        }
                        let hourIndex : number = raw[i].hour - hours["open"];
                        let minuteIndex : number = Math.floor(raw[i].minute / 15);
                        if (!rows[rowIndex].slots[hourIndex]) {
                            rows[rowIndex].slots[hourIndex] = [];
                        }
                        rows[rowIndex].slots[hourIndex][minuteIndex] = {
                            "isAvailable": raw[i].isAvailable == 1,
                            "center": raw[i].centerCode ? raw[i].centerCode : -1,
                            "time": raw[i].time
                        };

                        if (rows[rowIndex].slots[hourIndex][minuteIndex].isAvailable) {
                            rows[rowIndex].isAvailable = true;
                        }
                        if (rows[rowIndex].slots[hourIndex][minuteIndex].center != -1) {
                            rows[rowIndex].isScheduled = true;
                        }
                    }
                    eta.center.getAll((centers : eta.Center[]) => {
                        if (centers == null) {
                            callback({errcode: eta.http.InternalError});
                            return;
                        }
                        let locationPalette : {[key : string] : string} = {
                            "Clear": "CL"
                        };
                        for (let i : number = 0; i < centers.length; i++) {
                            if (centers[i].address != "") {
                                locationPalette[centers[i].shorthand] = centers[i].code;
                            }
                        }
                        for (let i : number = 0; i < rows.length; i++) {
                            if (!req.query.edit && !rows[i].isScheduled) {
                                rows.splice(i, 1);
                                i--;
                                continue; // ensuring no OOB if this was the last element
                            }
                            for (let k : number = 0; k < hours["close"] - hours["open"]; k++) {
                                if (!rows[i].slots[k]) {
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

                        if (filters["sort"]) {
                            if (filters["sort"] == "name") {
                                rows.sort((a : schedule.Row, b : schedule.Row) : number => {
                                    let tokensA : string[] = a.label.split(" ");
                                    let tokensB : string[] = b.label.split(" ");
                                    return tokensA[tokensA.length - 1].localeCompare(tokensB[tokensB.length - 1]);
                                })
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
