import {HelperStatus} from "lib/helpers/HelperStatus";

export module reports {

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
        let $table : JQuery = $("#table-results");
        let $header : JQuery = $("<tr>");
        for (let columnName in rows[0]) {
            $header.append($("<th>").text(columnName));
        }
        $table.find("thead").html("").append($header);
        let $body : JQuery = $table.find("tbody");
        $body.html("");
        for (let i : number = 0; i < rows.length; i++) {
            let $row : JQuery = $("<tr>");
            for (let columnName in rows[i]) {
                $row.append($("<td>").text(rows[i][columnName]));
            }
            $body.append($row);
        }
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
