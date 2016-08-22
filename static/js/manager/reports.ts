import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";

import {HelperStatus} from "lib/helpers/HelperStatus";

export module reports {

    let table : any;
    let status : HelperStatus;
    function onReportChange() : void {
        let fadeDuration : number = 200;
        let reportType : string = $("#input-report").val();
        let hideSelector : string = `.report-section:not([data-report="${reportType}"])`;
        let showSelector : string = `.report-section[data-report="${reportType}"]`;
        let hideElements : JQuery = $(hideSelector);

        // fadeOut won't callback if it's operating on an empty JQuery array
        if (hideElements.length === 0) {
            $(showSelector).fadeIn(fadeDuration);
        } else {
            hideElements.fadeOut(fadeDuration, function() {
                $(hideSelector).hide();
                $(showSelector).fadeIn(fadeDuration);
            });
        }
    }

    function onReportLoad(rows : any[]) : void {
        if (rows.length === 0) {
            status.error("No data matched your parameters.");
            return;
        }
        if (table) {
            table.clear();
            table.destroy();
        }
        let $headerRow : JQuery = $("<tr>");
        for (let columnName in rows[0]) {
            $headerRow.append($("<th>").text(columnName));
        }
        $("#table-results").find("thead").html("").append($headerRow);
        let $body : JQuery = $("#table-results").find("tbody").html("");
        for (let i : number = 0; i < rows.length; i++) {
            let $row : JQuery = $("<tr>");
            for (let columnName in rows[i]) {
                $row.append($("<td>").text(rows[i][columnName]));
            }
            $body.append($row);
        }
        table = (<any>$("#table-results")).DataTable({
            "buttons": ["csv", "print"],
            "dom": "Blftipr"
        });
        (<any>window).table = table;
    }

    function onReportSubmit() : void {
        let $parent : JQuery = $(this).closest(".section-input");
        let params : {[key : string] : string} = {
            "reportName": $("#input-report").val()
        };
        $parent.find("input,select,textarea[data-name]").each(function(index : number, element : HTMLElement) {
            let $input : JQuery = $(element);
            params[$input.attr("data-name")] = $input.val();
        });
        $.post("/office/post/generate-report", params, onReportLoad, "json").fail(function(data) {
            status.error("Error code " + data.status + " occurred.");
        });
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $("#input-report").on("change", onReportChange);
        $(".btn-report-submit").on("click", onReportSubmit);

        onReportChange();
    });
}
