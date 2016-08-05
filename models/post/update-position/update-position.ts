import * as eta from "eta-lib";
import * as express from "express";

export class Model implements eta.Model {
    public render(req : express.Request, res : express.Response, callback : (env : {[key : string] : any}) => void) : void {
        let moreSql : string = "WHEN name = ? THEN ?";
        let positions : {[ key : string ] : boolean } = JSON.parse(req.body.positions);
        let params : string[] = [];
        for(let position in positions){
            params = params.concat([position, positions[position] ? "1" : "0"]);
        }
        let sql : string = `
            UPDATE
                Position
            SET
                open = (CASE
                    ${moreSql.repeat(params.length / 2)}
                    ELSE Position.open
                END)
        `;

        eta.db.query(sql, params, (err : eta.DBError, rows : any[]) => {
            if (err) {
                eta.logger.dbError(err);
                callback({errcode: eta.http.InternalError});
                return;
            }
            callback({raw: "true"});
        })
    }
}
