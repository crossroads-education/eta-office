import * as eta from "eta-lib";

import * as express from "express";

import ScheduleCell from "../interfaces/ScheduleCell";
import ScheduleFilterOptions from "../interfaces/ScheduleFilterOptions";
import ScheduleRow from "../interfaces/ScheduleRow";

export default class HelperSchedule {

    private static getTimeFromCell(cell: ScheduleCell): number {
        return cell.hour + (cell.minute / 60);
    }

    private static getCellDifference(cell1: ScheduleCell, cell2: ScheduleCell): number {
        let time1: number = this.getTimeFromCell(cell1);
        let time2: number = this.getTimeFromCell(cell2);
        return Math.abs(time1 - time2);
    }

    public static redirectMobile(req: express.Request, res: express.Response): void {
        let os: string = eta.http.getUserAgent(req).os.family;
        let isMobile: boolean = os == "Android" || os == "iOS";
        if (isMobile && !req.path.endsWith("mobile")) {
            return res.redirect(req.path.replace(/\/desktop|\/index/g, "/mobile"));
        }
        if (!isMobile && !req.path.endsWith("desktop")) {
            return res.redirect(req.path.replace(/\/mobile|\/index/g, "/desktop"));
        }
    }

    public static getFilterOptions(req: any, userid?: string, bodyName: string = "query"): ScheduleFilterOptions {
        if (!userid) {
            userid = req.session["userid"];
        }
        let defaults: ScheduleFilterOptions = {
            "day": new Date().getDay(),
            "term": eta.term.getCurrent().id,
            "edit": false,
            "employee": userid
        };
        let options: ScheduleFilterOptions = eta.object.extend(eta.object.copy(req[bodyName]), defaults);
        options.day = Number(options.day);
        options.term = Number(options.term);
        return options;
    }

    public static fillRow(row: ScheduleRow, start: Date, end: Date, inactiveStart?: Date, inactiveEnd?: Date): ScheduleRow {
        for (let i: number = 0; i < row.cells.length - 1; i++) {
            let diff: number = this.getCellDifference(row.cells[i + 1], row.cells[i]);
            if (diff > 0.25) { // more than 15 minute gap
                let newTime: number = this.getTimeFromCell(row.cells[i]) + 0.25;
                row.cells.splice(i + 1, 0, {
                    "center": null,
                    "isAvailable": false,
                    "hour": Math.floor(newTime), // get hour component
                    "minute": (newTime % 1) * 60 // get minute component
                });
            }
        }
        if (row.cells.length === 0) {
            row.cells.push({
                "center": null,
                "isAvailable": false,
                "hour": start.getHours(),
                "minute": start.getMinutes()
            });
        }
        // prepending UV cells
        while (!(row.cells[0].hour == start.getHours() && row.cells[0].minute == start.getMinutes())) {
            let newTime: number = this.getTimeFromCell(row.cells[0]) - 0.25;
            row.cells.splice(0, 0, {
                "center": null,
                "isAvailable": false,
                "hour": Math.floor(newTime), // get hour component
                "minute": (newTime % 1) * 60 // get minute component
            });
        }
        // prepending XX cells
        if (inactiveStart) {
            while (!(row.cells[0].hour == inactiveStart.getHours() && row.cells[0].minute == inactiveStart.getMinutes())) {
                let newTime: number = this.getTimeFromCell(row.cells[0]) - 0.25;
                row.cells.splice(0, 0, {
                    "center": "XX",
                    "isAvailable": false,
                    "hour": Math.floor(newTime), // get hour component
                    "minute": (newTime % 1) * 60 // get minute component
                });
            }
        }
        // appending UV cells
        while (!(row.cells[row.cells.length - 1].hour == end.getHours() && row.cells[row.cells.length - 1].minute == end.getMinutes())) {
            let newTime: number = this.getTimeFromCell(row.cells[row.cells.length - 1]) + 0.25;
            row.cells.push({
                "center": null,
                "isAvailable": false,
                "hour": Math.floor(newTime), // get hour component
                "minute": (newTime % 1) * 60 // get minute component
            });
        }
        // appending XX cells
        if (inactiveEnd) {
            while (!(row.cells[row.cells.length - 1].hour == inactiveEnd.getHours() && row.cells[row.cells.length - 1].minute == inactiveEnd.getMinutes())) {
                let newTime: number = this.getTimeFromCell(row.cells[row.cells.length - 1]) + 0.25;
                row.cells.push({
                    "center": "XX",
                    "isAvailable": false,
                    "hour": Math.floor(newTime), // get hour component
                    "minute": (newTime % 1) * 60 // get minute component
                });
            }
        }
        return row;
    }

    public static getAllForEmployee(department: number, term: number, employeeID: string, hours: { [key: number]: eta.HoursOfOperation }, callback: (err: Error, rows?: ScheduleRow[], maxHours?: eta.TimeSpan) => void): void {
        let sql: string = `
            SELECT
                EmployeeSchedule.isAvailable,
                EmployeeSchedule.day,
                HOUR(EmployeeSchedule.time) AS hour,
                MINUTE(EmployeeSchedule.time) AS minute,
                Center.code AS center
            FROM
                EmployeeSchedule
                    LEFT JOIN Center ON
                        EmployeeSchedule.center = Center.id
            WHERE
                EmployeeSchedule.id = ? AND
                EmployeeSchedule.term = ?
            ORDER BY
                EmployeeSchedule.day ASC,
                EmployeeSchedule.time ASC`;
        eta.db.query(sql, [employeeID, term], (err: Error, rawCells: any[]) => {
            let message: string = null;
            if (err) {
                message = "No one has been scheduled yet";
            }
            let rows: ScheduleRow[] = [];
            for (let i: number = 0; i < eta.time.daysOfWeek.length; i++) {
                rows.push({
                    "id": i.toString(),
                    "lastName": eta.time.daysOfWeek[i],
                    "dayTotalHours": 0,
                    "weekTotalHours": 0,
                    "cells": []
                });
            }
            let weekTotalHours: number = 0; // assigned to all rows at once later
            for (let i: number = 0; i < rawCells.length; i++) {
                if (rawCells[i].center) {
                    rows[rawCells[i].day].dayTotalHours += 0.25;
                    weekTotalHours += 0.25;
                }
                rows[rawCells[i].day].cells.push(rawCells[i]);
            }
            let earliestOpen: Date = null;
            let latestClose: Date = null;
            for (let i in hours) {
                let open: Date = eta.time.getDateFromTime(hours[i].open);
                if (!hours[i] || hours[i].open == hours[i].close) {
                    continue;
                }
                if (earliestOpen === null || open.getTime() < earliestOpen.getTime()) {
                    earliestOpen = open;
                }
                let close: Date = eta.time.getDateFromTime(hours[i].close);
                close.setMinutes(close.getMinutes() - 15);
                if (latestClose === null || close.getTime() > latestClose.getTime()) {
                    latestClose = close;
                }
            }
            for (let i: number = 0; i < rows.length; i++) {
                rows[i].weekTotalHours = weekTotalHours;
                if (!hours[i] || hours[i].open == hours[i].close) {
                    rows.splice(i, 1);
                    continue; // closed, so remove the row
                }
                let open: Date = eta.time.getDateFromTime(hours[i].open);
                let close: Date = eta.time.getDateFromTime(hours[i].close);
                close.setMinutes(close.getMinutes() - 15);
                rows[i] = this.fillRow(rows[i], open, close, earliestOpen, latestClose);
            }
            callback(null, rows, {
                "start": earliestOpen,
                "end": latestClose,
                "message": message
            });
        });
    }

    public static getAllForDay(department: number, term: number, day: number, open: Date, close: Date, seeAll: boolean, callback: (err: Error, schedules?: ScheduleRow[]) => void): void {
        let sql: string = `
            SELECT DISTINCT
                EmployeeSchedule.id,
                EmployeeSchedule.isAvailable,
                EmployeeSchedule.time,
                HOUR(EmployeeSchedule.time) AS hour,
                MINUTE(EmployeeSchedule.time) AS minute,
                Center.code AS center
            FROM
                EmployeeSchedule
                    LEFT JOIN Center ON
                        EmployeeSchedule.center = Center.id
                    LEFT JOIN EmployeePosition ON
                        EmployeeSchedule.id = EmployeePosition.id AND
                        EmployeePosition.start <= CURDATE() AND
                        (
                            EmployeePosition.end IS NULL OR
                            EmployeePosition.end > CURDATE()
                        )
            WHERE
                EmployeeSchedule.term = ? AND
                EmployeeSchedule.day = ? AND
                EmployeePosition.position IS NOT NULL
            ORDER BY
                EmployeeSchedule.id ASC,
                EmployeeSchedule.time ASC`;
        eta.db.query(sql, [term, day], (err: Error, rawCells: any[]) => {
            if (err) {
                return callback(err);
            }
            if (rawCells.length === 0) {
                return callback(new Error("No rows found"));
            }
            // so we can query names
            let employeeIDs: string[] = [];
            // indexed on employee ID
            let rows: { [key: string]: ScheduleRow } = {};
            for (let i: number = 0; i < rawCells.length; i++) {
                if (employeeIDs.indexOf(rawCells[i].id) === -1) {
                    employeeIDs.push(rawCells[i].id);
                }
                if (!rows[rawCells[i].id]) {
                    rows[rawCells[i].id] = {
                        "id": rawCells[i].id,
                        "firstName": "",
                        "lastName": "",
                        "dayTotalHours": 0,
                        "weekTotalHours": 0,
                        "cells": [rawCells[i]],
                        "positionNames": [],
                        "positionCategories": []
                    };
                } else {
                    rows[rawCells[i].id].cells.push(rawCells[i]);
                }
            }
            // get employee names using `employeeIDs`
            sql = `
                SELECT
                    Person.id,
                    Person.firstName,
                    Person.lastName,
                    ScheduleWeekTotals.hours AS weekTotalHours,
                    Position.name AS positionName,
                    Position.category AS positionCategory
                FROM
                    Person
                        RIGHT JOIN EmployeePosition ON
                            Person.id = EmployeePosition.id
                        RIGHT JOIN Position ON
                            EmployeePosition.position = Position.id
                        RIGHT JOIN (
                            SELECT
                                EmployeeSchedule.id,
                                (COUNT(DISTINCT CASE WHEN
                                    EmployeeSchedule.center != -1 THEN
                                    CONCAT(EmployeeSchedule.day, ' ', EmployeeSchedule.time)
                                    ELSE 0 END) - 1) / 4 AS hours
                            FROM
                                EmployeeSchedule
                            WHERE
                                EmployeeSchedule.term = ?
                            GROUP BY
                                EmployeeSchedule.id
                        ) AS ScheduleWeekTotals ON
                            Person.id = ScheduleWeekTotals.id
                WHERE
                    Person.id IN (?) AND
                    EmployeePosition.start <= CURDATE() AND
                    (
                        EmployeePosition.end IS NULL OR
                        EmployeePosition.end > CURDATE()
                    )`;
            eta.db.query(sql, [term, employeeIDs], (err: Error, rawPersonRows: any[]) => {
                if (err) {
                    return callback(err);
                }
                // combining names with employee rows
                for (let i: number = 0; i < rawPersonRows.length; i++) {
                    let id: string = rawPersonRows[i].id;
                    if (!rows[id].firstName) { // haven't set this yet
                        rows[id].firstName = rawPersonRows[i].firstName;
                        rows[id].lastName = rawPersonRows[i].lastName;
                        rows[id].weekTotalHours = rawPersonRows[i].weekTotalHours;
                        // manually count daily total hours
                        for (let i: number = 0; i < rows[id].cells.length; i++) {
                            if (rows[id].cells[i].center !== null) {
                                rows[id].dayTotalHours += 0.25;
                            }
                        }
                    }
                    if (rows[id].positionNames.indexOf(rawPersonRows[i].positionName) === -1) {
                        rows[id].positionNames.push(rawPersonRows[i].positionName);
                    }
                    if (rows[id].positionCategories.indexOf(rawPersonRows[i].positionCategory) === -1) {
                        rows[id].positionCategories.push(rawPersonRows[i].positionCategory);
                    }
                }
                let rowArray: ScheduleRow[] = [];
                for (let id in rows) {
                    if (rows[id].dayTotalHours === 0 && !seeAll) {
                        continue;
                    }
                    rowArray.push(this.fillRow(rows[id], open, close));
                }
                rowArray.sort((a: ScheduleRow, b: ScheduleRow): number => {
                    if (a.lastName == b.lastName) {
                        return a.firstName.localeCompare(b.firstName);
                    }
                    return a.lastName.localeCompare(b.lastName);
                });
                callback(null, rowArray);
            });
        });
    }
}
