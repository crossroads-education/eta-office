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

    $(document).ready(function() {
        table = $("#table-timesheet").dataTable(<any>{
            "order": [[0, "desc"], [1, "desc"]]
        });
        useIP = $("#table-timesheet").data("use-ip");
    });
}
