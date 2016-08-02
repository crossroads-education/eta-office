import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let sql : string = `
            SELECT
                Person.firstName,
                Person.lastName,
                Person.id
            FROM
                Employee
                    LEFT JOIN Person ON
                        Employee.id = Person.id
            WHERE
                Employee.current = 1
            ORDER BY Person.lastName, Person.firstName`;
        eta.db.query(sql, [], (err : eta.DBError, employeeRows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            sql = `
                SELECT
                    Log.timestamp,
                    Log.message,
                    CONCAT(AboutPerson.firstName, ' ', AboutPerson.lastName) AS about,
                    CONCAT(AuthorPerson.firstName, ' ', AuthorPerson.lastName) AS author
                FROM
                    Log
                        LEFT JOIN Person AboutPerson ON
                            Log.about = AboutPerson.id
                        LEFT JOIN Person AuthorPerson ON
                            Log.author = AuthorPerson.id
                WHERE
                    Log.type = 'FRONT'`;
            eta.db.query(sql, [], (err : eta.DBError, logRows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                callback({
                    "employees": employeeRows,
                    "logs": logRows
                });
            });
        });
    }
}
