import * as eta from "eta-lib";

import * as express from "express";
import * as querystring from "querystring";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let sql : string = `
            SELECT
                shirt.size,
                shirt.count AS "shirtCount",
                hoodie.count AS "hoodieCount"
            FROM
                (
                    SELECT
                        Employee.shirt AS size,
                        COUNT(*) AS count
                    FROM
                        Employee
                            LEFT JOIN EmployeePosition ON
                                Employee.id = EmployeePosition.id
                            LEFT JOIN Position ON
                                EmployeePosition.position = Position.id
                            LEFT JOIN Center ON
                                Position.center = Center.id
                    WHERE
                        Center.department = ?
                    GROUP BY Employee.shirt
                ) AS shirt
                    LEFT JOIN (
                        SELECT
                            Employee.hoodie AS size,
                            COUNT(*) AS count
                        FROM
                            Employee
                                LEFT JOIN EmployeePosition ON
                                    Employee.id = EmployeePosition.id
                                LEFT JOIN Position ON
                                    EmployeePosition.position = Position.id
                                LEFT JOIN Center ON
                                    Position.center = Center.id
                        WHERE
                            Center.department = ?
                        GROUP BY Employee.hoodie
                    ) AS hoodie ON
                        shirt.size = hoodie.size`;
        eta.db.query(sql, [req.session["department"], req.session["department"]], (err : eta.DBError, shirtRows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            let shirtSizes : {[key : string] : any} = {};
            for (let i : number = 0; i < shirtRows.length; i++) {
                shirtSizes[shirtRows[i].size] = shirtRows[i];
            }
            sql = `
                SELECT
                    Position.name,
                    SUBSTRING_INDEX(GROUP_CONCAT(DISTINCT Position.category ORDER BY Position.category DESC), ',', 1) AS category,
                    COUNT(EmployeePosition.id) AS count
                FROM
                    EmployeePosition
                        LEFT JOIN Position ON
                            EmployeePosition.position = Position.id
                        LEFT JOIN Center ON
                            Position.center = Center.id
                WHERE
                    EmployeePosition.start <= CURDATE() AND
                    (
                        ISNULL(EmployeePosition.end) OR
                        EmployeePosition.end >= CURDATE()
                    ) AND
                    NOT (
                        Position.name != 'Assistant Manager' AND
                        Position.category = 'Management'
                    ) AND
                    Position.name != 'Project Manager' AND
                    Position.category != 'META' AND
                    Center.department = ?
                GROUP BY Position.name
                ORDER BY Position.name, category`;
            eta.db.query(sql, [req.session["department"]], (err : eta.DBError, positionCounts : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                let params : string[] = [req.query.allowanceTerm ? req.query.allowanceTerm : eta.term.getCurrent().id];
                let whereSql : string = "Employee.current = 1";
                if (req.query.positionName && req.query.positionName != "") {
                    whereSql += " AND Position.name = ?";
                    params.push(req.query.positionName);
                }
                if (req.query.positionCategory && req.query.positionCategory != "") {
                    whereSql += " AND Position.category = ?";
                    params.push(req.query.positionCategory);
                }
                sql = `
                    SELECT
                        Employee.*,
                        EmployeeAllowance.alarm,
                        EmployeeAllowance.call1,
                        EmployeeAllowance.call2,
                        EmployeeAllowance.sick,
                        EmployeeAllowance.hw1,
                        EmployeeAllowance.hw2,
                        EmployeeAllowance.hw3,
                        Person.firstName,
                        Person.lastName,
                        Person.username
                    FROM
                        EmployeePosition
                            LEFT JOIN Employee ON
                                EmployeePosition.id = Employee.id
                            LEFT JOIN EmployeeAllowance ON
                                EmployeePosition.id = EmployeeAllowance.id AND
                                EmployeeAllowance.term = ?
                            LEFT JOIN Person ON
                                EmployeePosition.id = Person.id
                            LEFT JOIN Position ON
                                EmployeePosition.position = Position.id
                            LEFT JOIN Center ON
                                Position.center = Center.id
                    WHERE
                        ${whereSql} AND
                        EmployeePosition.start <= CURDATE() AND
                        (
                            ISNULL(EmployeePosition.end) OR
                            EmployeePosition.end >= CURDATE()
                        ) AND
                        Center.department = ?
                    GROUP BY Employee.id
                    ORDER BY Person.lastName, Person.firstName`;
                params.push(req.session["department"]);
                eta.db.query(sql, params, (err : eta.DBError, employeeRows : any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({errcode: eta.http.InternalError});
                        return;
                    }
                    if (employeeRows.length === 0) {
                        res.redirect("/office/manager/employees?error=404");
                        return;
                    }
                    let employeeIDs : string[] = [];
                    for (let i : number = 0; i < employeeRows.length; i++) {
                        employeeIDs.push(employeeRows[i].id);
                    }
                    sql = `
                        SELECT
                            Position.id,
                            EmployeePosition.id AS employee,
                            Position.name,
                            Position.category,
                            EmployeePosition.start,
                            EmployeePosition.end
                        FROM
                            EmployeePosition
                                LEFT JOIN Position ON
                                    EmployeePosition.position = Position.id
                                LEFT JOIN Center ON
                                    Position.center = Center.id
                        WHERE
                            EmployeePosition.id IN (?) AND
                            Center.department = ?`;
                    eta.db.query(sql, [employeeIDs, req.session["department"]], (err : eta.DBError, employeePositionRows : any[]) => {
                        if (err) {
                            eta.logger.dbError(err);
                            callback({errcode: eta.http.InternalError});
                            return;
                        }
                        let rawEmployees : {[key : string] : any} = {};
                        for (let i : number = 0; i < employeePositionRows.length; i++) {
                            let id : string = employeePositionRows[i].employee;
                            if (!rawEmployees[id]) {
                                let employeeIndex : number = -1;
                                for (let k : number = 0; k < employeeRows.length; k++) {
                                    if (employeeRows[k].id == id) {
                                        employeeIndex = k;
                                    }
                                }
                                rawEmployees[id] = eta.object.copy(employeeRows[employeeIndex]);
                                rawEmployees[id].positions = [];
                                rawEmployees[id].positionNames = [];
                                rawEmployees[id].positionCategories = [];
                                rawEmployees[id].timesheet = [];
                            }
                            rawEmployees[id].positions.push(employeePositionRows[i]);
                            rawEmployees[id].positionNames.push(employeePositionRows[i].name);
                            rawEmployees[id].positionCategories.push(employeePositionRows[i].category);
                        }
                        let employees : any[] = [];
                        for (let i in rawEmployees) { // converting from object to array
                            rawEmployees[i].positions.sort((a : any, b : any) : number => {
                                let aTime : number = a.start.getTime();
                                let bTime : number = b.start.getTime();
                                return aTime > bTime ? 1 : (aTime < bTime ? -1 : 0);
                            });
                            employees.push(rawEmployees[i]);
                        }
                        employees.sort((a : any, b : any) : number => {
                            if (a.lastName == b.lastName) {
                                return a.firstName.localeCompare(b.firstName);
                            }
                            return a.lastName.localeCompare(b.lastName);
                        });
                        sql = `
                            SELECT
                                Position.*
                            FROM
                                Position
                                    LEFT JOIN Center ON
                                        Position.center = Center.id
                            WHERE
                                Position.active = 1 AND
                                Center.department = ?
                            ORDER BY
                                Position.category,
                                Position.name`;
                        eta.db.query(sql, [req.session["department"]], (err : eta.DBError, positionRows : any[]) => {
                            if (err) {
                                eta.logger.dbError(err);
                                callback({errcode: eta.http.InternalError});
                                return;
                            }
                            sql = "SELECT * FROM EmployeeTimesheet";
                            eta.db.query(sql, [], (err : eta.DBError, timesheetRows : any[]) => {
                                if (err) {
                                    eta.logger.dbError(err);
                                    callback({errcode: eta.http.InternalError});
                                    return;
                                }
                                for (let i : number = 0; i < timesheetRows.length; i++) {
                                    let employeeIndex : number = -1;
                                    for (let k : number = 0; k < employees.length; k++) {
                                        if (timesheetRows[i].id == employees[k].id) {
                                            employeeIndex = k;
                                            break;
                                        }
                                    }
                                    if (employeeIndex == -1) {
                                        continue; // they aren't in the dataset, who cares
                                    }
                                    employees[employeeIndex].timesheet.push(timesheetRows[i]);
                                }
                                callback({
                                    "employees": employees,
                                    "positions": positionRows,
                                    "positionCounts": positionCounts,
                                    "shirtSizes": shirtSizes,
                                    "filters": req.query
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}
