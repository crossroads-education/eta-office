import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        if (!req.query.term) {
            req.query.term = eta.term.getCurrent(true).id;
        }
        let sql: string = `
            SELECT
                Person.id,
                Person.firstName,
                Person.lastName,
                Person.email,
                Applicant.expectedGraduation,
                GROUP_CONCAT(DISTINCT ApplicantPosition.position ORDER BY ApplicantPosition.position SEPARATOR '<br/>') AS positionNames,
                Applicant.evaluate,
                Applicant.interview,
                Applicant.hire,
                Applicant.notes
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
        eta.db.query(sql, [req.query.term], (err: eta.DBError, applicantRows: any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({ errcode: eta.http.InternalError });
                return;
            }
            let sql: string = `
                SELECT
                    ApplicantPosition.*,
                    ApplicantEvaluation.date AS evalDate,
                    ApplicantEvaluation.score AS evalScore
                FROM
                    ApplicantPosition
                        LEFT JOIN Term ON
                            ApplicantPosition.lastApplied >= Term.start AND
                            ApplicantPosition.lastApplied <= Term.end
                        LEFT JOIN ApplicantEvaluation ON
                            ApplicantPosition.id = ApplicantEvaluation.id AND
                            ApplicantPosition.position = ApplicantEvaluation.level
                WHERE
                    Term.id = ?`;
            eta.db.query(sql, [req.query.term], (err: eta.DBError, positionRows: any[]) => {
                if (err) {
                    eta.logger.dbError(err);
                    callback({ errcode: eta.http.InternalError });
                    return;
                }
                for (let i: number = 0; i < positionRows.length; i++) {
                    let index: number = -1;
                    for (let k: number = 0; k < applicantRows.length; k++) {
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
                sql = `
                    SELECT DISTINCT
                        Position.name
                    FROM
                        Position
                            LEFT JOIN Center ON
                                Position.center = Center.id
                    WHERE
                        Position.active = 1 AND
                        Position.name LIKE '%-Level' AND
                        Center.department = ?`;
                eta.db.query(sql, [req.session["department"]], (err: eta.DBError, levelRows: any[]) => {
                    if (err) {
                        eta.logger.dbError(err);
                        callback({ errcode: eta.http.InternalError });
                        return;
                    }
                    sql = `
                        SELECT
                            Position.id,
                            Position.name,
                            Position.category
                        FROM
                            Position
                                LEFT JOIN Center ON
                                    Position.center = Center.id
                        WHERE
                            Position.active = 1 AND
                            Center.department = ?
                        ORDER BY
                            Position.name,
                            Position.category`;
                    eta.db.query(sql, [req.session["department"]], (err: eta.DBError, hirePositionRows: any[]) => {
                        if (err) {
                            eta.logger.dbError(err);
                            callback({ errcode: eta.http.InternalError });
                            return;
                        }
                        let terms: eta.Term[] = eta.term.getClosest(eta.term.get(req.query.term), true);
                        sql = ``; // TODO: finish
                        callback({
                            "applicants": applicantRows,
                            "currentTerm": req.query.term,
                            "evaluationLevels": levelRows,
                            "hirePositions": hirePositionRows,
                            "selectTerms": terms
                        });
                    });
                });
            });
        });
    }
}
