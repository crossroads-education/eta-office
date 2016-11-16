import "datatables.net";
import "datatables.net-bs";

export module timesheet {
    export let table: DataTables.DataTable;
    let useIP: boolean;

    export interface TimesheetRow {
        id: string;
        timeIn: string; // ISO format, from JSON
        timeOut: string; // ISO format, from JSON
        ipIn?: string;
        ipOut?: string;
    }

    export function addRow(row: TimesheetRow) {
        let timeIn: Date = new Date(row.timeIn);
        let timeOut: Date = row.timeOut ? new Date(row.timeOut) : null;
        let totalHours: number = timeOut ? (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60) : 0;
        let data: string[] = [
            timeIn.toLocaleDateString(),
            totalHours.toFixed(2),
            timeIn.toLocaleTimeString(),
            timeOut ? timeOut.toLocaleTimeString() : "NONE"
        ];
        if (useIP) {
            data.push(row.ipIn);
            data.push(row.ipOut);
        }
        table.fnAddData(data, true);
    }

    function getWeekOfTheYear(date : Date = new Date){
        date = new Date(date.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        let week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        //algorithm from https://weeknumber.net/how-to/javascript
    }
    export function updateRowBorders(): void{
        for(let i : number = 0; i < rows.length - 1; i++){
            let date2 : Date = new Date(rows[i+1].children[0].innerHTML);
            if(getWeekOfTheYear(date1) != getWeekOfTheYear(date2)){
                $(rows[i + 1].children).css("border-top-width", "5px")
                    .css("border-top-color", "#444651");
            }
        }
    }
    $(document).ready(function() {
        table = $("#table-timesheet").dataTable(<any>{
            "order": [[0, "desc"], [1, "desc"]]
        });
        $("#table-timesheet").on("draw.dt", function () {
            updateRowBorders();
        })
        useIP = $("#table-timesheet").data("use-ip");
    });
}
