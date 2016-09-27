/// <amd-dependency path="./templates/schedule.js"/>

export module schedule {
    function onSubmit(): void {
        let params: { [key: string]: any } = {
            "day": $(".schedule-filter-cell.border-rounded").data("value"),
            "term": $("#schedule-term").val(),
            "cells": []
        };
        $(".schedule-cell-quarter[data-changed]").each(function(index: number, element: HTMLElement) {
            let $this: JQuery = $(this);
            let userid: string = $this.closest(".schedule-cell-row").attr("data-userid");
            let time: string = $this.attr("data-time");
            let location: string = $this.attr("data-previous-color");
            params["cells"].push({
                "userid": userid,
                "time": time,
                "centerCode": location
            });
            $this.removeAttr("data-changed");
        });
        params["cells"] = JSON.stringify(params["cells"]);
        console.log(params);
        $.post("/office/post/update-schedule", params, function(data) {
            $("#schedule-error").addClass("hidden");
            $("#schedule-message").text("Successfully updated schedule.").removeClass("hidden");
        }).fail(function(data) {
            $("#schedule-message").addClass("hidden");
            $("#schedule-error").text("Error status " + data.status + " occurred.").removeClass("hidden");
        });
    }
    $(document).ready(function() {
        $(".btn-schedule-submit").on("click", onSubmit);
    });
}
