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
        eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            let shirtSizes : {[key : string] : any} = {};
            for (let i : number = 0; i < rows.length; i++) {
                shirtSizes[rows[i].size] = rows[i];
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
                sql = `
                    SELECT
                        Position.name,
                        Position.category,
                        EmployeePosition.start,
                        EmployeePosition.end,
                        Employee.*,
                        Person.firstName,
                        Person.lastName
                    FROM
                        EmployeePosition
                            LEFT JOIN Employee ON
                                EmployeePosition.id = Employee.id
                            LEFT JOIN Person ON
                                EmployeePosition.id = Person.id
                            LEFT JOIN Position ON
                                EmployeePosition.position = Position.id
                    WHERE
                        Employee.current = 1
                    ORDER BY Person.lastName, Person.firstName`;
                eta.db.query(sql, [], (err : eta.DBError, rows : any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({errcode: eta.http.InternalError});
                        return;
                    }
                    let rawEmployees : {[key : string] : any} = {};
                    for (let i : number = 0; i < rows.length; i++) {
                        let id : string = rows[i].id;
                        if (!rawEmployees[id]) {
                            rawEmployees[id] = eta.object.copy(rows[i]);
                            rawEmployees[id].positions = [];
                            delete
                                rawEmployees[id].name,
                                rawEmployees[id].category,
                                rawEmployees[id].start,
                                rawEmployees[id].end;
                        }
                        rawEmployees[id].positions.push({
                            "name": rows[i].name,
                            "category": rows[i].category,
                            "start": rows[i].start,
                            "end": rows[i].end
                        });
                    }
                    let employees : any[] = [];
                    for (let i in rawEmployees) {
                        employees.push(rawEmployees[i]);
                    }
                    employees.sort((a : any, b : any) : number => {
                        if (a.lastName == b.lastName) {
                            return a.firstName.localeCompare(b.firstName);
                        }
                        return a.lastName.localeCompare(b.lastName);
                    });
                    callback({
                        "employees": employees,
                        "positionCounts": positionCounts,
                        "shirtSizes": shirtSizes
                    });
                });
            });
        });
    }
}
