/// <reference path="../typings/index.d.ts"/>
import "datatables.net";
import "datatables-bootstrap";
import "select2";

export module front {
    let table : DataTables.DataTable;
    function onSubmit() : void {
        let about : string = $("#input-about").val();
        let message : string = $("#input-message").val();
        $("#input-message").val("");
        $.post("/office/post/add-log", {
            "about": about,
            "message": message,
            "type": "FRONT"
        }, function(log) {
            $("#modal-error").html("");
            $("#modal-success").html("Successfully logged message.");
            let $row : JQuery = $("<tr>");
            $row.append($("<td>").text(log.timestamp));
            $row.append($("<td>").text(log.author));
            $row.append($("<td>").text(log.about));
            $row.append($("<td>").text(log.message));
            table.fnAddData($row);
        }, "json").fail(function(data) {
            $("#modal-success").html("");
            $("#modal-error").html("Error code " + data.status + " occurred - could not log message.");
        });
    }
    $(document).ready(function() {
        $("#input-about").select2({
            "placeholder": "Employee"
        });
        $("#btn-submit").on("click", onSubmit);
        table = $("#logs").closest("table").dataTable(<any>{
            "order": [[0, "desc"]]
        });
        (<any>window).table = table;
    });
}
