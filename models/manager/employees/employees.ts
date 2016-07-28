import * as eta from "eta-lib";

import * as express from "express";

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
                        shirt AS size,
                        COUNT(*) AS count
                    FROM
                        Employee
                    GROUP BY shirt
                ) AS shirt
                    LEFT JOIN (
                        SELECT
                            hoodie AS size,
                            COUNT(*) AS count
                        FROM
                            Employee
                        GROUP BY hoodie
                    ) AS hoodie ON
                        shirt.size = hoodie.size
        `;
        eta.db.query(sql, [], (err : eta.DBError, shirtRows : any[]) => {
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
                    Position.category != 'META'
                GROUP BY Position.name
                ORDER BY category
            `;
            eta.db.query(sql, [], (err : eta.DBError, positionCounts : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                let params : string[] = [];
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
                        Person.firstName,
                        Person.lastName,
                        Person.username
                    FROM
                        EmployeePosition
                            LEFT JOIN Employee ON
                                EmployeePosition.id = Employee.id
                            LEFT JOIN Person ON
                                EmployeePosition.id = Person.id
                            LEFT JOIN Position ON
                                EmployeePosition.position = Position.id
                    WHERE
                        ${whereSql}
                    GROUP BY Employee.id
                    ORDER BY Person.lastName, Person.firstName`;
                eta.db.query(sql, params, (err : eta.DBError, employeeRows : any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({errcode: eta.http.InternalError});
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
                        WHERE
                            EmployeePosition.id IN (?)`;
                    eta.db.query(sql, [employeeIDs], (err : eta.DBError, positionRows : any[]) => {
                        if (err) {
                            eta.logger.dbError(err);
                            callback({errcode: eta.http.InternalError});
                            return;
                        }
                        let rawEmployees : {[key : string] : any} = {};
                        for (let i : number = 0; i < positionRows.length; i++) {
                            let id : string = positionRows[i].employee;
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
                            }
                            rawEmployees[id].positions.push(positionRows[i]);
                            rawEmployees[id].positionNames.push(positionRows[i].name);
                            rawEmployees[id].positionCategories.push(positionRows[i].category);
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
                        sql = "SELECT * FROM Position WHERE active = 1 ORDER BY category, name";
                        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
                            if (err) {
                                eta.logger.dbError(err);
                                callback({errcode: eta.http.InternalError});
                                return;
                            }
                            callback({
                                "employees": employees,
                                "positions": rows,
                                "positionCounts": positionCounts,
                                "shirtSizes": shirtSizes,
                                "filters": req.query
                            });
                        });
                    });
                });
            });
        });
    }
}
