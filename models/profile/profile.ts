import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {

    private generateSignature(employee : any) : string {
        let signature : string = `${employee.firstName} ${employee.lastName}\n`;
        let location : string[] = employee.positionCenters;
        let nameTokens : string[] = employee.positionNames.split(",");
        let categoryTokens : string[] = employee.positionCategories.split(",");
        let managerTokens : string[] = [];
        for (let i : number = 0; i < nameTokens.length; i++) {
            let position : string = nameTokens[i] + " Student Tutor";
            if (categoryTokens[i] == "Graduate") {
                position = nameTokens[i] + " Graduate Student Tutor";
            } else if (categoryTokens[i] == "META") {
                position = "META, " + nameTokens[i];
            } else if (categoryTokens[i] == "Management") {
                if (["Executive Director", "Senior Project Manager"].indexOf(nameTokens[i]) >= 0) {
                    position = nameTokens[i];
                } else {
                    let managerToken : string = nameTokens[i];
                    if (managerToken == "Assistant Manager") {
                        position = "";
                        continue;
                    }
                    if (["Designer", "Programmer", "Videographer"].indexOf(managerToken) >= 0) {
                        // if meta manager
                        managerToken = "META";
                    }
                    if (managerTokens.indexOf(managerToken) === -1) {
                        // avoid duplicates
                        managerTokens.push(managerToken);
                    }
                    position = "";
                }
            }
            if (position !== "") {
                signature += position + "\n";
            }
        }
        if (managerTokens.length > 0) {
            signature += managerTokens.join(", ") + " Manager\n";
        }
        signature += location;
        return signature;
    }

    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let sql : string = `
            SELECT
                Person.firstName,
                Person.lastName,
                Employee.*,
                Applicant.workStudy,
                GROUP_CONCAT(Position.name ORDER BY Position.id) AS positionNames,
                GROUP_CONCAT(Position.category ORDER BY Position.id) AS positionCategories,
                GROUP_CONCAT(DISTINCT CONCAT(Center.name, ' [', Center.shorthand, ']', '\n\n', Center.address) ORDER BY Center.name) AS positionCenters
            FROM
                Employee
                    LEFT JOIN Person ON
                        Employee.id = Person.id
                    LEFT JOIN Applicant ON
                        Employee.id = Applicant.id
                    LEFT JOIN EmployeePosition ON
                        Employee.id = EmployeePosition.id AND
                        EmployeePosition.start <= CURDATE() AND
                        (EmployeePosition.end > CURDATE() OR ISNULL(EmployeePosition.end))
                    LEFT JOIN Position ON
                        EmployeePosition.position = Position.id
                    LEFT JOIN Center ON
                        Position.center = Center.id
            WHERE
                Employee.id = ? AND
                Employee.current = 1
        `;
        eta.db.query(sql, [req.session["userid"]], (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            if (rows.length === 0) {
                callback({errcode: eta.http.NotFound});
                return;
            }
            let signature : string = this.generateSignature(rows[0]);
            let env : {[key : string] : any} = {
                "employee": rows[0],
                "minHours": 12,
                "maxHours": 27,
                "shirtSizes": ["S", "M", "L", "XL", "XXL", "XXXL"],
                "signature": signature
            };
            callback(env);
        });
    }
}
