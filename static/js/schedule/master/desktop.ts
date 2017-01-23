import { HelperStatus } from "lib/helpers/HelperStatus";
import "schedule/desktop";

export module schedule_master_desktop {
    let status: HelperStatus;

    function onSubmit(): void {
        let $changedCells: JQuery = $(`.schedule-cell[data-changed]`);
        let params: { [key: string]: any } = {
            "day": $(".schedule-filter-input[data-name='day']").val(),
            "term": $(".schedule-filter-input[data-name='term']").val(),
            "cells": []
        };
        $changedCells.each(function(index: number, element: HTMLElement): void {
            let $cell: JQuery = $(element);
            let userid: string = $cell.parent().attr("data-id");
            let time: string = $cell.attr("data-hour") + ":" + $cell.attr("data-minute");
            let centerCode: string = $cell.attr("data-location");
            params["cells"].push({
                "userid": userid,
                "time": time,
                "centerCode": centerCode
            });
        });
        params["cells"] = JSON.stringify(params["cells"]);
        $changedCells.removeAttr("data-changed");
        console.log(params);
        $.post("/office/post/update-schedule", params, function(data: any) {
            status.success("Successfully applied changes.");
        }).fail(function(data: any) {
            status.error("Failed to apply changes: error " + data.status + " occurred.");
        });
    }

    $(document).ready(function() {
        status = new HelperStatus(".status-success", ".status-error");
        $(".btn-submit").on("click", onSubmit);
    });

    $(document).on("schedule.loaded", <any>function(type: string) {
        if (type !== "desktop") {
            return;
        }
        // prevent selection of unavailable cells
        let oldFilter: string = $(".schedule-container").selectable("option", "filter");
        $(".schedule-container").selectable("option", "filter", oldFilter + ":not([data-location='UV'])");
    });
}
