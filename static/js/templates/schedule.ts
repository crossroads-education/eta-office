/// <reference path="../typings/index.d.ts"/>

import "jquery-ui";
import "jquery-ui-touch-punch";
import "select2";
import {HelperUrl} from "lib/helpers/HelperUrl";

export module TemplateSchedule {

    let cellCount : number;
    let currentRow : number = -1;

    /**
    Gets a specific quarter element by row and column
    */
    function getQuarter(row : number, column : number) : JQuery {
        return $(`div[data-row='${row}'][data-column='${column}']`);
    }

    /**
    Sets a quarter's "activeness" and modifies adjacent quarters appropriately.
    Inactive means that the quarter has no style associated with it, active vice versa.
    */
    function setActive(element : JQuery, colorClass : string, isActive : boolean) : void {
        let previousColor : string = element.attr("data-previous-color");
        if (previousColor != colorClass && previousColor != "none") {
            element.removeClass(previousColor);
        }
        element.removeClass("first last keep" + previousColor);
        element[isActive ? "addClass" : "removeClass"]("active " + colorClass);
        let row : number = Number(element.attr("data-row"));
        let column : number = Number(element.attr("data-column"));
        let previousElement : JQuery = getQuarter(row, column - 1);
        let nextElement : JQuery = getQuarter(row, column + 1);
        if (previousElement.length > 0) { // if it was found
            if (previousElement.hasClass(colorClass)) {
                previousElement[(isActive ? "remove" : "add") + "Class"]("last");
            } else {
                element[(isActive ? "add" : "remove") + "Class"]("first");
            }
        }
        if (nextElement.length > 0) {
            if (nextElement.hasClass(colorClass)) {
                nextElement[(isActive ? "remove" : "add") + "Class"]("first");
            } else {
                element[(isActive ? "add" : "remove") + "Class"]("last");
            }
        }
        if (isActive) {
            if (previousElement.hasClass("active") && !previousElement.hasClass(colorClass)) {
                previousElement.addClass("last");
            }
            if (nextElement.hasClass("active") && !nextElement.hasClass(colorClass)) {
                nextElement.addClass("first");
            }
        }
        element.attr("data-previous-color", isActive ? colorClass : "none");
    }

    function onPageSetup(index : number, element : HTMLElement) : void {
        let $this = $(this);
        let time : string = $this.attr("data-time");
        if (time == "00:00:00") {
            $this.addClass("inactive");
            return;
        }
        let location : string = $this.attr("data-location");
        if (location != "") {
            setActive($this, location, true);
        }
    }

    function onInactiveSetup(index : number, element : HTMLElement) : void {
        let $this = $(this);
        let row : number = $this.data("row");
        let col : number = $this.data("column");
        let $before : JQuery = getQuarter(row, col - 1);
        let $after : JQuery = getQuarter(row, col + 1);
        if ($before.length == 0 || !$before.hasClass("inactive")) {
            $this.addClass("first");
        }
        if ($after.length == 0 || !$after.hasClass("inactive")) {
            $this.addClass("last");
        }
    }

    function filter() : void {
        // $(".schedule-row-filterable").show();
        let shouldFilter : boolean = false;
        let selectors : {[key : string] : string[]} = {};
        let filters : {[key : string] : string[]} = {};
        $(".input-filter").each(function(index : number, element : HTMLElement) {
            let filterName : string = $(element).data("filter");
            let values : string[] = $(element).val();
            if (values && values.length > 0) {
                shouldFilter = true;
                for (let i : number = 0; i < values.length; i++) {
                    if (!selectors[filterName]) {
                        selectors[filterName] = [];
                    }
                    selectors[filterName].push(`[data-${filterName}*='${values[i]}']`);
                }
                filters[filterName] = values;
            }
        });
        if (shouldFilter) {
            location.hash = "#" + JSON.stringify(filters);
            let $hide : JQuery = $(".schedule-row-filterable");
            let $show : JQuery = $(".schedule-row-filterable");
            let final : string = "";
            for (let i in selectors) {
                let selector : string = selectors[i].join(",");
                $show = $show.filter(selector);
            }
            let notSelector : string = ".schedule-cell-row:not(.schedule-header-row)";
            $show.each(function(index : number, element : HTMLElement) : void {
                let userid : string = $(this).find(".schedule-cell-row").attr("data-userid");
                notSelector += `:not([data-userid='${userid}'])`;
            });
            $(notSelector).parent().hide();
            $show.show();
        } else {
            $(".schedule-row-filterable").show(); // no filters are selected, so show everything
        }
    }

    function onSelect(event : Event, ui : {selecting? : Element}) : void {
        if (currentRow == -1) {
            currentRow = $(ui.selecting).data("row");
        }
        let selector : string = "[data-row='" + currentRow + "']";
        let palette : string = $("#schedule-palette").val();
        if ($("#row-type").val() == "person") {
            selector += ":not(.UV)";
            if (palette != "CL") {
                selector += "[data-available]";
            }
        }
        let element : JQuery = $(ui.selecting).closest(selector).not(".keep" + $("#schedule-palette").val());
        setActive(element, palette, true);
        element.attr("data-changed", "true");
    }

    function onSelectFinish(event : Event, ui : {selected? : Element}) : void {
        let className : string = $("#schedule-palette").val();
        let selected : JQuery = $(ui.selected).closest("[data-row='" + currentRow + "']");
        selected.addClass("keepSelect");
        // if (className == "AV" || className == "UV") {
        //     return;
        // }
        selected.addClass(" keep" + className + " " + className);
        currentRow = -1;
    }

    function onUnselect(event : Event, ui : {unselecting? : Element}) : void {
        // currentRow = $(ui.unselecting).data("row");
        let selector : string = "[data-row='" + currentRow + "']";
        if ($("#row-type").val() == "person") {
            selector += ":not(.AV .UV)";
        }
        let element : JQuery = $(ui.unselecting).closest(selector).not(".keepSelect");
        setActive(element, $("#schedule-palette").val(), false);
        element.attr("data-changed", "true");
        $(ui.unselecting).closest("[data-row='" + currentRow + "']").not(".keep" + $("#schedule-palette").val()).removeClass("keepSelect");
    }

    function onFilterLink() : void {
        let value : string = this.value;
        if (value == undefined) {
            value = this.getAttribute("data-value");
        }
        HelperUrl.setParameterByName(this.getAttribute("data-param"), value);
    }

    function onWindowResize() {
        let shouldHide : boolean = $(window).width() < 1180;
        $(".schedule-hours,.schedule-header-hours")[shouldHide ? "hide" : "show"]();
        $(".schedule-left-col .col-xs-8,.col-xs-12")
            .addClass("col-xs-" + (shouldHide ? "12" : "8"))
            .removeClass("col-xs-" + (shouldHide ? "8" : "12"));
    }

    $(document).ready(function() {
        cellCount = $(".schedule-cell-quarter[data-row='0']").length;

        // Initialize cell quarters
        // First and last cells are inactive
        $(".schedule-cell-quarter").each(onPageSetup);
        $(".schedule-cell-quarter.inactive").each(onInactiveSetup);

        $(".input-filter").each(function(index : number, element : HTMLElement) {
            let $this : JQuery = $(this);
            let placeholder : string = "";
            let filter : string = $this.data("filter");
            if (filter == "position-names") {
                placeholder = "Position";
            } else if (filter == "position-categories") {
                placeholder = "Category";
            }
            $this.select2(<any>{
                "maximumSelectionLength": 4,
                "placeholder": placeholder
            });
        });
        $(".input-filter").on("change", filter);

        $("span.schedule-filter-link").on("click", onFilterLink);
        $("select.schedule-filter-link").on("change", onFilterLink);

        $(window).on("resize", onWindowResize);
        onWindowResize();

        if (location.hash !== "") {
            let filters : {[key : string] : string[]} = JSON.parse(location.hash.substring(1));
            for (let name in filters) {
                $(`.input-filter[data-filter="${name}"]`).val(filters[name]).trigger("change");
            }
        }

        if ($("#schedule-palette")[0]) { // if they're allowed to select things
            // use jqueryui's selectable
            $(".schedule-box").selectable({
                filter: ".schedule-cell-quarter:not(.inactive)",
                delay: 50,
                distance: 1,
                //make things active as they are selected
                selecting: onSelect,
                //give some extra things after everything is selected
                selected: onSelectFinish,
                //whenever something stops having something dragged on it, de-select it.
                unselecting: onUnselect
            });
        }
        filter(); // some values are set by server on load, and .on(change) doesn't recognize them
    });
}
