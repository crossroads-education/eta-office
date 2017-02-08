import * as eta from "eta-lib";

import * as express from "express";

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let sql: string = `
            SELECT
                Recommendee.id,
                CONCAT(Recommender.firstName, ' ', Recommender.lastName) AS recommender,
                CONCAT(Recommendee.firstName, ' ', Recommendee.lastName) AS recommendee,
                Recommendation.position,
                Recommendation.lastUpdated
            FROM
                Recommendation
                    LEFT JOIN Person Recommender ON
                        Recommendation.recommender = Recommender.id
                    LEFT JOIN Person Recommendee ON
                        Recommendation.recommendee = Recommendee.id`;
        eta.db.query(sql, [], (err: Error, recommendationRows: any[]) => {
            if (err) {
                eta.logger.error(err);
                return callback({errcode: eta.http.InternalError});
            }
            sql = `
                SELECT
                    Person.id,
                    CONCAT(Person.firstName, ' ', Person.lastName) AS name,
                    GROUP_CONCAT(DISTINCT ApplicantPosition.position ORDER BY ApplicantPosition.position ASC SEPARATOR ', ') AS positions,
                    Applicant.evaluationScore,
                    Applicant.lastUpdated
                FROM
                    Applicant
                        LEFT JOIN Person ON
                            Applicant.id = Person.id
                        LEFT JOIN ApplicantPosition ON
                            Applicant.id = ApplicantPosition.id
                GROUP BY Applicant.id
                ORDER BY
                    Person.lastName,
                    Person.firstName`;
            eta.db.query(sql, [], (err: Error, applicantRows: any[]) => {
                if (err) {
                    eta.logger.error(err);
                    return callback({errcode: eta.http.InternalError});
                }
                let recommendedApplied: any[] = [];
                for (let i: number = 0; i < applicantRows.length; i++) {
                    for (let k: number = 0; k < recommendationRows.length; k++) {
                        if (recommendationRows[k].id == applicantRows[i].id) {
                            let row: any = eta.object.copy(applicantRows[i]);
                            row.recommendee = row.name;
                            row.recommender = recommendationRows[k].recommender;
                            recommendedApplied.push(row);
                            break;
                        }
                    }
                }
                callback({
                    applicants: applicantRows,
                    recommendations: recommendationRows,
                    recommendedApplied: recommendedApplied
                });
            });
        });
    }
}
