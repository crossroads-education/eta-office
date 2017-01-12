import "schedule/desktop";

export module schedule_master_desktop {
    function onSubmit(): void {
        let $changedCells: JQuery = $(`.schedule-cell[data-changed]`);
        let params: { [key: string]: any } = {
            "day": $(".schedule-filter-input[data-name='day']").val(),
            "term": $(".schedule-filter-input[data-name='term']").val(),
            "cells": []
        };
        $changedCells.each(function(index: number, element: HTMLElement): void {

        });
        // TODO
    }

    $(document).ready(function() {
        $(".btn-submit").on("click", onSubmit);
    });

    $(document).on("schedule.loaded", function() {
        // prevent selection of unavailable cells
        let oldFilter: string = $(".schedule-container").selectable("option", "filter");
        $(".schedule-container").selectable("option", "filter", oldFilter + ":not([data-location='UV'])");
    });
}
