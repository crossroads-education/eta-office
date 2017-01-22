import "schedule/global";
import "lib/jquery/scrollHead";

export module schedule_desktop {
    function getPaletteSelection(): string {
        return $(".schedule-palette-input").val();
    }

    /**
    Highlights hour, minute, and employee name labels for cells being hovered over.
    Removes highlighting for labels whose cells are not being hovered over
    */
    function onCellHoverStart(this: HTMLElement, event: JQueryEventObject): void {
        let $this: JQuery = $(this);
        let id: string = $this.parent().attr("data-employee");
        let hour: string = $this.attr("data-hour");
        let time: string = hour + ":" + $this.attr("data-minute");
        let location: string = $this.attr("data-location");
        // employee name label
        $(`.schedule-row:not([data-employee='${id}']) .schedule-name-cell.border-highlight`).removeClass("border-highlight");
        $this.parent().find(".schedule-name-cell").addClass("border-highlight");
        // hour label
        $(`.schedule-label-row-hour th.border-highlight:not([data-hour='${hour}'])`).removeClass("border-highlight");
        $(`.schedule-label-row-hour th[data-hour='${hour}']`).addClass("border-highlight");
        // minute label
        $(`.schedule-label-row-minute th.border-highlight:not([data-time='${time}'])`).removeClass("border-highlight");
        $(`.schedule-label-row-minute th[data-time='${time}']`).addClass("border-highlight");
        // legend label
        // TODO: Determine whether this feature is useful
        // $(`.schedule-label-row-legend th.border-highlight:not([data-location='${location}'])`).removeClass("border-highlight");
        // $(`.schedule-label-row-legend th[data-location='${location}']`).addClass("border-highlight");
    }

    let currentRow: string = "";
    function onCellSelectProgress(event: Event, ui: { selecting: Element }): void {
        let paletteSelection: string = getPaletteSelection();
        let $selecting: JQuery = $(ui.selecting);
        let id: string = $selecting.parent().attr("data-id");
        if (currentRow === "") {
            currentRow = id;
        } else {
            if (currentRow != id) { // force selection along same row
                return;
            }
        }
        $selecting.attr("data-location", paletteSelection);
    }

    function onCellSelectFinish(event: Event, ui: {}): void {
        // only allow this to run once per select (instead of once per element as default)
        if (currentRow === "") {
            return;
        }
        // ensure we're only pulling from the starting row
        let $selected: JQuery = $(`.schedule-row[data-id='${currentRow}'] .schedule-cell.ui-selected`);
        $selected.attr("data-changed", "true");
        currentRow = ""; // reset to allow additional selects
    }

    /**
    Allows users to click a legend cell to change their palette.
    */
    function onLegendSelect(): void {
        let location: string = $(this).attr("data-location");
        let isValid: boolean = false;
        $(".schedule-palette-input option").each(function(index: number, element: HTMLElement): void {
            if ($(element).attr("value") == location) {
                isValid = true;
            }
        });
        if (isValid) {
            $(".schedule-palette-input").val($(this).attr("data-location")).trigger("change");
        }
    }

    function onLoad(this: HTMLElement): void {
        $(this).find(".schedule-legend-row .schedule-cell").on("click", onLegendSelect);
    }

    $(document).ready(function() {
        $(".schedule-cell").hover(onCellHoverStart);
        $(".schedule-container").scrollHead();
        if ($(".schedule-palette-input").length > 0) { // able to select cells
            $(".schedule-container tbody").selectable({
                "filter": ".schedule-cell:not([data-location='XX'])",
                "selecting": onCellSelectProgress, // set classes and such to display while in-progress
                "stop": onCellSelectFinish
            });
        }
        $(document.body).on("scrollHead.loaded", function() {
            onLoad.apply(document.getElementById("fixed-head"));
        });
        onLoad.apply(document.body);
        $(document).trigger("schedule.loaded", "desktop");
    });
}
