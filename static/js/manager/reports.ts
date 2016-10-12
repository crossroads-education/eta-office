import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";
import "select2";

import { HelperStatus } from "lib/helpers/HelperStatus";

export module reports {

    let table: any;
    let status: HelperStatus;

    function onSelect2All(): void {
        $($(this).attr("data-select2")).select2('destroy').find('option').prop('selected', 'selected').end().select2();
    }

    function onReportChange(): void {
        let fadeDuration: number = 200;
        let reportType: string = $("#input-report").val();
        let hideSelector: string = `.report-section:not([data-report="${reportType}"])`;
        let showSelector: string = `.report-section[data-report="${reportType}"]`;
        let hideElements: JQuery = $(hideSelector);

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

    function onReportLoad(rows: any[]): void {
        if (rows.length === 0) {
            status.error("No data matched your parameters.");
            return;
        }
        if (table) {
            table.clear();
            table.destroy();
        }
        let $headerRow: JQuery = $("<tr>");
        for (let columnName in rows[0]) {
            $headerRow.append($("<th>").text(columnName));
        }
        $("#table-results").find("thead").html("").append($headerRow);
        let $body: JQuery = $("#table-results").find("tbody").html("");
        for (let i: number = 0; i < rows.length; i++) {
            let $row: JQuery = $("<tr>");
            for (let columnName in rows[i]) {
                $row.append($("<td>").text(rows[i][columnName]));
            }
            $body.append($row);
        }
        table = (<any>$("#table-results")).DataTable({
            "buttons": ["csv", "print"],
            "dom": "Blftipr",
            "order": [[0, "desc"]]
        });
        (<any>window).table = table;
        if ($("#input-report").val() == "payroll") {
            let total: number = 0;
            for (let i: number = 0; i < rows.length; i++) {
                total += Number(rows[i]["Weekly Expenditure"].substring(1));
            }
            $("#results-total").parent().show();
            $("#results-total").html(" $" + Math.round(total * 100) / 100);
        }
    }

    function onReportSubmit(): void {
        let $parent: JQuery = $(this).closest(".section-input");
        let params: { [key: string]: any } = {
            "reportName": $("#input-report").val(),
            "jsonParams": []
        };
        $parent.find("input,select,textarea[data-name]").each(function(index: number, element: HTMLElement) {
            let $input: JQuery = $(element);
            let name: string = $input.attr("data-name");
            let val: any = $input.val();
            if ($input.hasClass("report-select2")) {
                val = JSON.stringify(val);
                params["jsonParams"].push(name);
            }
            params[name] = val;
        });
        params["jsonParams"] = JSON.stringify(params["jsonParams"]);
        $.post("/office/post/generate-report", params, onReportLoad, "json").fail(function(data) {
            status.error("Error code " + data.status + " occurred.");
        });
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $("#input-report").on("change", onReportChange);
        $(".btn-report-submit").on("click", onReportSubmit);
        $(".select-2-all").on("click", onSelect2All);
        $(".report-select2").each(function() {
            let $this: JQuery = $(this);
            $this.select2(<any>{
                "placeholder": $this.attr("data-placeholder")
            });
        });
        onReportChange();
    });
}
