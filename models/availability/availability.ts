import * as eta from "eta-lib";
import * as schedule from "../../lib/templates/Schedule";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!req.query.userid) {
            req.query.userid = req.session["userid"];
        }
        // Day name from http://stackoverflow.com/a/32908851/5850070
        let sql: string = `
            SELECT
                EmployeeSchedule.center,
                EmployeeSchedule.time,
                EmployeeSchedule.day,
                EmployeeSchedule.isAvailable,
                Center.code AS centerCode,
                DAYNAME(CONCAT("1970-09-2", EmployeeSchedule.day)) AS dayName,
                HOUR(EmployeeSchedule.time) AS hour,
                MINUTE(EmployeeSchedule.time) AS minute,
                DayTotal.totalHours AS dayTotal,
                WeekTotal.totalHours AS weekTotal
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
                EmployeeSchedule.id = ? AND
                (
                    Center.department = ? OR
                    ISNULL(Center.department)
                )
            ORDER BY
                EmployeeSchedule.day,
                EmployeeSchedule.time`;
        let term: string = req.query.term ? req.query.term : eta.term.getCurrent().id;
        let params: string[] = [term, req.query.userid, req.session["department"]];
        eta.db.query(sql, params, (err: eta.DBError, raw: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            sql = `
                SELECT
                    HoursOfOperation.day,
                    HOUR(HoursOfOperation.open) AS open,
                    HOUR(HoursOfOperation.close) AS close
                FROM
                    HoursOfOperation
                        LEFT JOIN Center ON
                            HoursOfOperation.center = Center.id
                WHERE
                    HoursOfOperation.term = ? AND
                    HoursOfOperation.center = ? AND
                    Center.department = ?
                ORDER BY HoursOfOperation.day ASC`;
            params = [term, eta.setting.get("/center", "main").value.toString(), req.session["department"]];
            eta.db.query(sql, params, (err: eta.DBError, hourRows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                if (hourRows.length === 0) {
                    callback({ errcode: eta.http.NotFound });
                    return;
                }
                let hours: { open: number, close: number } = eta.object.copy(hourRows[0]);
                for (let i: number = 0; i < hourRows.length; i++) {
                    if (hourRows[i].open != 0 || hourRows[i].close != 0) {
                        if (hourRows[i].open < hours.open) {
                            hours.open = hourRows[i].open;
                        }
                        if (hourRows[i].close > hours.close) {
                            hours.close = hourRows[i].close;
                        }
                    }
                }
                let openHourDate: Date = new Date();
                openHourDate.setHours(hours.open);
                let closeHourDate: Date = new Date();
                closeHourDate.setHours(hours.close);
                let allHoursOpen: string[] = eta.time.fillTimes(openHourDate, closeHourDate, eta.time.span1Hour, "ht");
                let rows: schedule.Row[] = [];
                for (let i: number = 0; i < raw.length; i++) {
                    let rowIndex: number = -1;
                    if (raw[i].hour >= hours.close || raw[i].open < hours.open) {
                        continue;
                    }
                    for (let k: number = 0; k < rows.length; k++) {
                        if (rows[k].day == raw[i].day) {
                            rowIndex = k;
                            break;
                        }
                    }
                    if (rowIndex == -1) { // set up new row
                        rowIndex = rows.length;
                        rows.push({
                            "day": raw[i].day,
                            "label": raw[i].dayName,
                            "filterables": {},
                            "dayTotal": raw[i].dayTotal,
                            "weekTotal": raw[i].weekTotal,
                            "slots": [],
                            "isAvailable": false,
                            "isScheduled": false
                        });
                    }
                    let hourIndex: number = raw[i].hour - hours.open;
                    let minuteIndex: number = Math.floor(raw[i].minute / 15);
                    if (!rows[rowIndex].slots[hourIndex]) {
                        rows[rowIndex].slots[hourIndex] = [];
                    }
                    rows[rowIndex].slots[hourIndex][minuteIndex] = {
                        "isAvailable": raw[i].isAvailable == 1,
                        "center": raw[i].centerCode ? raw[i].centerCode : -1,
                        "time": raw[i].time,
                        "isLast": false,
                        "isFirst": false
                    };

                    if (rows[rowIndex].slots[hourIndex][minuteIndex].isAvailable) {
                        rows[rowIndex].isAvailable = true;
                    }
                    if (rows[rowIndex].slots[hourIndex][minuteIndex].center != -1) {
                        rows[rowIndex].isScheduled = true;
                    }
                }
                let dayNames: string[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                let closedDays: number[] = [];
                for (let i: number = 0; i < dayNames.length; i++) {
                    let isSet: boolean = false;
                    for (let k: number = 0; k < rows.length; k++) {
                        if (rows[k].day == i) {
                            isSet = true;
                            break;
                        }
                    }
                    if (!isSet) {
                        rows.push({
                            "day": i,
                            "label": dayNames[i],
                            "filterables": {},
                            "dayTotal": 0,
                            "weekTotal": raw[0] ? raw[0].weekTotal : 0,
                            "slots": [],
                            "isAvailable": false,
                            "isScheduled": false
                        });
                    }
                }

                rows.sort(function(a: schedule.Row, b: schedule.Row): number {
                    return a.day == b.day ? 0 : (a.day > b.day ? 1 : -1);
                });

                let locationPalette: { [key: string]: string } = {
                    "Available": "AV",
                    "Unavailable": "UV"
                };

                for (let i: number = 0; i < rows.length; i++) {
                    for (let k: number = 0; k < hours.close - hours.open; k++) {
                        if (!rows[i].slots[k]) {
                            rows[i].slots[k] = [];
                        }
                        for (let j: number = 0; j < 4; j++) {
                            if (!rows[i].slots[k][j]) {
                                let hour: number = k + hours.open;
                                let time: string = `${hour}:${j == 0 ? "00" : j * 15}:00`;
                                if (closedDays.indexOf(i) !== -1 || hour < hourRows[i].open || hour >= hourRows[i].close) {
                                    time = "00:00:00";
                                }
                                rows[i].slots[k][j] = {
                                    "center": -1,
                                    "isAvailable": false,
                                    "time": time,
                                    "isLast": false,
                                    "isFirst": false
                                };
                            }
                        }
                    }
                }
                for (let i: number = 0; i < rows.length; i++) {
                    rows[i].slots = schedule.checkFirstLast(rows[i].slots);
                }
                let permissions: eta.PermissionUser = req.session["permissions"];
                let env: { [key: string]: any } = {
                    "isOther": req.query.userid != req.session["userid"],
                    "isManager": permissions.has("edit/schedule/master"),
                    "scheduleRowType": "day",
                    "scheduleFilters": {
                        "term": term
                    },
                    "scheduleRows": rows,
                    "scheduleMode": "availability",
                    "scheduleHours": allHoursOpen,
                    "scheduleLocationPalette": locationPalette
                };
                // if (env["isOther"] && env["isManager"]) {
                sql = `
                        SELECT
                            Employee.id,
                            Person.firstName,
                            Person.lastName,
                            Employee.notes
                        FROM
                            Employee
                                LEFT JOIN Person ON
                                    Employee.id = Person.id
                        WHERE
                            Employee.id = ?`;
                eta.db.query(sql, [req.query.userid], (err: eta.DBError, rows: any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({ errcode: eta.http.InternalError });
                        return;
                    }
                    env["about"] = rows[0];
                    callback(env);
                })
                // } else {
                //     callback(env);
                // }
            });
        });
    }
}
