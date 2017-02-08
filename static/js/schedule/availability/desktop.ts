import { HelperStatus } from "lib/helpers/HelperStatus";
import "schedule/desktop";

export module schedule_availability_desktop {
    let status: HelperStatus;

    function onSubmit(): void {
        let $changedCells: JQuery = $(`.schedule-cell[data-changed]`);
        let params: { [key: string]: any } = {
            "term": $(".schedule-filter-input[data-name='term']").val(),
            "cells": []
        };
        $changedCells.each(function(index: number, element: HTMLElement): void {
            let $cell: JQuery = $(element);
            let day: string = $cell.parent().attr("data-id");
            let time: string = $cell.attr("data-hour") + ":" + $cell.attr("data-minute");
            let centerCode: string = $cell.attr("data-location");
            params["cells"].push({
                "day": day,
                "time": time,
                "isAvailable": centerCode == "AV"
            });
        });
        params["cells"] = JSON.stringify(params["cells"]);
        $changedCells.removeAttr("data-changed");
        console.log(params);
        $.post("/office/post/update-availability", params, function(data: any) {
            status.success("Successfully applied changes.");
        }).fail(function(data: any) {
            status.error("Failed to apply changes: error " + data.status + " occurred.");
        });
    }

    $(document).ready(function() {
        status = new HelperStatus(".status-success", ".status-error");
        $(".btn-submit").on("click", onSubmit);
    });
}
