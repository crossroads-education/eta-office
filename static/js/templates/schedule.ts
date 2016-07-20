/// <amd-dependency path="jquery-ui"/>
/// <reference path="../typings/index.d.ts"/>

import {HelperUrl} from "../lib/helpers/HelperUrl.js";

export module TemplateSchedule {

    var cellCount : number;

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
        if (colorClass == "UV") {
            element.html(isActive ? "X" : "");
            return;
        } else if (colorClass == "AV") {
            element.html(isActive ? "" : "X");
            return;
        }
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
        var cell : number = Number(element.getAttribute("data-cell"));
        var quarter : number = Number(element.getAttribute("data-quarter"));
        if (cell == -1) {
            element.className += " inactive";
            if (quarter == 0) {
                element.className += " first";
            } else if (quarter == 3) {
                element.className += " last";
            }
        }
        var location : string = element.getAttribute("data-location");
        if (location != "") {
            setActive($(element), location, true);
        }
        var isAvailable : string = element.getAttribute("data-available");
        if (isAvailable == "false") {
            element.innerHTML = "X";
        }
    }

    function filter() : void {
        $(".schedule-row-filterable").show();
        let selector : string = ".schedule-row-filterable";
        let shouldFilter : boolean = false;
        $(".input-filter").each((index : number, element : HTMLElement) => {
            let filter : string = element.getAttribute("data-filter");
            let value : string = (<HTMLInputElement> element).value;
            if (value != "") {
                shouldFilter = true;
                selector += `:not([data-${filter}*='${value}'])`;
            }
        });
        if (shouldFilter) {
            console.log(selector);
            $(selector).hide();
        } else {
            console.log("No filter required");
        }
    }

    function onSelect(event : Event, ui : {selecting? : Element}) : void {
        let element : JQuery = $(ui.selecting).not(".keep" + $("#schedule-palette").val());
        setActive(element, $("#schedule-palette").val(), true);
        element.attr("data-changed", "true");
    }

    function onSelectFinish(event : Event, ui : {selected? : Element}) : void {
        var className : string = $("#schedule-palette").val();
        ui.selected.className += " keepSelect";
        if (className == "AV" || className == "UV") {
            return;
        }
        ui.selected.className += " keep" + className + " " + className;
    }

    function onUnselect(event : Event, ui : {unselecting? : Element}) : void {
        let element : JQuery = $(ui.unselecting).not(".keepSelect");
        setActive(element, $("#schedule-palette").val(), false);
        element.attr("data-changed", "true");
        $(ui.unselecting).not(".keep" + $("#schedule-palette").val()).removeClass("keepSelect");
    }

    function onFilterLink() {
        let value : string = this.value;
        if (value == undefined) {
            value = this.getAttribute("data-value");
        }
        HelperUrl.setParameterByName(this.getAttribute("data-param"), value);
    }

    $(document).ready(function() {
        cellCount = $(".schedule-cell-quarter[data-row='0']").length;

        // Initialize cell quarters
        // First and last cells are inactive
        $(".schedule-cell-quarter").each(onPageSetup);

        $(".input-filter").on("change", () => {
            filter();
        });

        $("span.schedule-filter-link").on("click", onFilterLink);
        $("select.schedule-filter-link").on("change", onFilterLink);

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
    });
}
