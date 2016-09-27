import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = `
            SELECT
                Person.firstName as firstName,
                Person.lastName as lastName,
                Person.email as email,
                Employee.phone as phone,
                Employee.altEmail as altEmail,
                GROUP_CONCAT(DISTINCT Position.name SEPARATOR '<br/>') as positions,
                GROUP_CONCAT(DISTINCT Position.category SEPARATOR '<br/>') as categories
            FROM
                Employee
                    LEFT JOIN Person ON
                        Employee.id = Person.id
                    LEFT JOIN EmployeePosition ON
                        Employee.id = EmployeePosition.id
                    LEFT JOIN Position ON
                        EmployeePosition.position = Position.id
                    LEFT JOIN Center ON
                        Position.center = Center.id
            WHERE
                Employee.current = 1 AND
                (
                    EmployeePosition.end > CURDATE() OR
                    EmployeePosition.end IS NULL
                ) AND
                EmployeePosition.start <= CURDATE() AND
                Center.department = ?
            GROUP BY Employee.id
            ORDER BY Person.firstName, Person.lastName`;
        eta.db.query(sql, [req.session["department"]], (err: eta.DBError, rows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }

            callback({ employees: rows });
        })
    }
}
