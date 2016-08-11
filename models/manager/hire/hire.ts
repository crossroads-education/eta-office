import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        if (!req.query.term) {
            req.query.term = eta.term.getCurrent(true).id;
        }
        let sql : string = `
            SELECT
                Person.id,
                Person.firstName,
                Person.lastName,
                Person.email,
                Applicant.expectedGraduation,
                GROUP_CONCAT(DISTINCT ApplicantPosition.position ORDER BY ApplicantPosition.position SEPARATOR '<br/>') AS positionNames,
                Applicant.evaluate,
                Applicant.interview,
                Applicant.hire
            FROM
                Applicant
                    LEFT JOIN ApplicantPosition ON
                        Applicant.id = ApplicantPosition.id
                    LEFT JOIN Person ON
                        Applicant.id = Person.id
                    LEFT JOIN Term ON
                        ApplicantPosition.lastApplied >= Term.start AND
                        ApplicantPosition.lastApplied <= Term.end
            WHERE
                Term.id = ?
            GROUP BY Applicant.id
        `;
        eta.db.query(sql, [req.query.term], (err : eta.DBError, applicantRows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            let sql : string = `
                SELECT
                    ApplicantPosition.*
                FROM
                    ApplicantPosition
                        LEFT JOIN Term ON
                            ApplicantPosition.lastApplied >= Term.start AND
                            ApplicantPosition.lastApplied <= Term.end
                WHERE
                    Term.id = ?`;
            eta.db.query(sql, [req.query.term], (err : eta.DBError, positionRows : any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({errcode: eta.http.InternalError});
                    return;
                }
                for (let i : number = 0; i < positionRows.length; i++) {
                    let index : number = -1;
                    for (let k : number = 0; k < applicantRows.length; k++) {
                        if (applicantRows[k].id == positionRows[i].id) {
                            index = k;
                            break;
                        }
                    }
                    if (!applicantRows[index].positions) {
                        applicantRows[index].positions = [];
                    }
                    applicantRows[index].positions.push(positionRows[i]);
                }
                let terms : eta.Term[] = eta.term.getClosest(eta.term.get(req.query.term), true);
                callback({
                    "applicants": applicantRows,
                    "currentTerm": req.query.term,
                    "selectTerms": terms
                });
            });
        });
    }
}
