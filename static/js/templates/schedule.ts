/// <reference path="../typings/index.d.ts"/>

import "jquery-ui";
import "jquery-ui-touch-punch";
import "select2";
import {HelperUrl} from "lib/helpers/HelperUrl";

export module TemplateSchedule {

    let cellCount: number;
    let currentRow: number = -1;

    /**
     Gets a specific quarter element by row and column
     */
    function getQuarter(row: number, column: number): JQuery {
        return $(`div[data-row='${row}'][data-column='${column}']`);
    }

    /**
     Sets a quarter's "activeness" and modifies adjacent quarters appropriately.
     Inactive means that the quarter has no style associated with it, active vice versa.
     */
    function setActive(element: JQuery, colorClass: string, isActive: boolean): void {
        let previousColor: string = element.attr("data-previous-color");
        if (previousColor != colorClass && previousColor != "none") {
            element.removeClass(previousColor);
        }
        element.removeClass("first last keep" + previousColor);
        element[isActive ? "addClass" : "removeClass"]("active " + colorClass);
        let row: number = Number(element.attr("data-row"));
        let column: number = Number(element.attr("data-column"));
        let previousElement: JQuery = getQuarter(row, column - 1);
        let nextElement: JQuery = getQuarter(row, column + 1);
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

    function onPageSetup(index: number, element: HTMLElement): void {
        let centers: any = {
            2: "MA",
            3: "MO",
            7: "SO",
            8: "ST"
        };
        let $this = $(this);
        let time: string = $this.attr("data-time");
        if (time == "00:00:00") {
            $this.addClass("inactive");
            return;
        }
        let location: string = $this.attr("data-location");
        location = location == "UV" || location == "AV" ? location : centers[location];
        if (location != "") {
            setActive($this, location, true);
        }
    }

    function onInactiveSetup(index: number, element: HTMLElement): void {
        let $this = $(this);
        let row: number = $this.data("row");
        let col: number = $this.data("column");
        let $before: JQuery = getQuarter(row, col - 1);
        let $after: JQuery = getQuarter(row, col + 1);
        if ($before.length == 0 || !$before.hasClass("inactive")) {
            $this.addClass("first");
        }
        if ($after.length == 0 || !$after.hasClass("inactive")) {
            $this.addClass("last");
        }
    }

    function filter(): void {
        let shouldFilter: boolean = false;
        let selectors: { [key: string]: string[] } = {};
        let filters: { [key: string]: string[] } = {};
        $(".input-filter").each(function (index: number, element: HTMLElement) {
            let filterName: string = $(element).data("filter");
            let values: string[] = $(element).val();
            if (values && values.length > 0) {
                shouldFilter = true;
                for (let i: number = 0; i < values.length; i++) {
                    if (!selectors[filterName]) {
                        selectors[filterName] = [];
                    }
                    selectors[filterName].push(`${values[i]}`);
                }
                filters[filterName] = values;
            }
        });
        if (shouldFilter) {
            location.hash = "#" + JSON.stringify(filters);
            let show: any = [];
            let $rows: JQuery = $(".schedule-row-filterable");
            let selected: any = [];
            $rows.hide();
            for (let i in selectors) {
                for (let j in selectors[i]) {
                    selected.push(selectors[i][j]);
                }
            }
            $rows.each(function (i, el) {
                if (passFilter(selectors, $(el))) {
                    show.push(el);
                }
            });
            $(show).each(function () {
                $(this).show();
            });
            updateSelectedFilters(selected);
        } else {
            updateSelectedFilters("");
            location.hash = ""; // reset filters to empty
            $(".schedule-row-filterable").show(); // no filters are selected, so show everything
        }
    }

    function passFilter(filter: any, domElement: JQuery): boolean {
        let count: number = 0;
        let passCount: number = 0;
        // let pass: boolean = false;
        for (let i in filter) {
            for (let j in filter[i]) {
                count++;
                if(domElement.attr('data-' + i).indexOf(filter[i][j]) != -1){
                    passCount++;
                }
                // var pass = domElement.attr('data-' + i).indexOf(filter[i][j]) != -1;
            }
        }
        return count == passCount;
    }

    function onSelect(event: Event, ui: { selecting?: Element }): void {
        if (currentRow == -1) {
            currentRow = $(ui.selecting).data("row");
        }
        let selector: string = "[data-row='" + currentRow + "']";
        let palette: string = $("#schedule-palette").val();
        if ($("#row-type").val() == "person") {
            selector += ":not(.UV)";
            if (palette != "CL") {
                selector += "[data-available]";
            }
        }
        let element: JQuery = $(ui.selecting).closest(selector).not(".keep" + $("#schedule-palette").val());
        setActive(element, palette, true);
        element.attr("data-changed", "true");
    }

    function onSelectFinish(event: Event, ui: { selected?: Element }): void {
        let className: string = $("#schedule-palette").val();
        let selected: JQuery = $(ui.selected).closest("[data-row='" + currentRow + "']");
        selected.addClass("keepSelect");
        // if (className == "AV" || className == "UV") {
        //     return;
        // }
        selected.addClass(" keep" + className + " " + className);
        currentRow = -1;
    }

    function onUnselect(event: Event, ui: { unselecting?: Element }): void {
        // currentRow = $(ui.unselecting).data("row");
        let selector: string = "[data-row='" + currentRow + "']";
        if ($("#row-type").val() == "person") {
            selector += ":not(.AV .UV)";
        }
        let element: JQuery = $(ui.unselecting).closest(selector).not(".keepSelect");
        setActive(element, $("#schedule-palette").val(), false);
        element.attr("data-changed", "true");
        $(ui.unselecting).closest("[data-row='" + currentRow + "']").not(".keep" + $("#schedule-palette").val()).removeClass("keepSelect");
    }

    function onFilterLink(): void {
        let value: string = this.value;
        let positions: string[] = [];
        let categories: string[] = [];
        if (value == undefined) {
            value = this.getAttribute("data-value");
        }
        HelperUrl.setParameterByName(this.getAttribute("data-param"), value);
    }

    function onWindowResize() {
        let shouldHide: boolean = $(window).width() < 1180;
        $(".schedule-hours,.schedule-header-hours")[shouldHide ? "hide" : "show"]();
        $(".schedule-left-col .col-xs-8,.col-xs-12")
            .addClass("col-xs-" + (shouldHide ? "12" : "8"))
            .removeClass("col-xs-" + (shouldHide ? "8" : "12"));
    }

    function onEmployeeClick(userID: any, term: number, day: number, rowID: number, parent: HTMLElement): void {
        $.post("/office/post/get-schedule", {
            "id": userID,
            "term": term,
            "day": day
        }, function (schedule) {
            constructSchedule(schedule, rowID, parent);
            $(document).trigger('schedule-complete');
        }, "json");
    }

    function constructSchedule(schedule: any, rowID: number, parent: HTMLElement): void {
        let cellsInRow: any = [];
        let scheduleContainer: JQuery = $(parent).parent().find('.schedule-box');
        let emptyCell: JQuery = scheduleContainer.find('.clone').clone();
        let emptyRow: JQuery = $('<div class="schedule-cell"></div>');
        emptyCell.removeClass('clone');
        emptyCell.attr('data-row', rowID);
        emptyCell.attr('data-cell', -1);
        emptyCell.attr('data-previous-color', 'none');
        emptyCell.attr('data-location', '');
        emptyCell.attr('data-available', 'false');
        emptyCell.attr('data-time', '00:00:00');
        for (let i: number = 0; i < 4; i++) {
            emptyRow.append(emptyCell.clone());
        }
        scheduleContainer.append(emptyRow);
        $(schedule).each(function () {
            let scheduleCellQuarter: JQuery = scheduleContainer.find('.clone').clone();
            scheduleCellQuarter.removeClass('clone');
            let location: any = this.center == -1 ? ((this.isAvailable == 1) ? "AV" : "UV") : this.center;
            scheduleCellQuarter.attr('data-row', rowID);
            // scheduleCellQuarter.attr('data-cell');
            // scheduleCellQuarter.attr('data-quarter');
            // scheduleCellQuarter.attr('data-column');
            scheduleCellQuarter.attr('data-location', location);
            scheduleCellQuarter.attr('data-available', this.isAvailable);
            scheduleCellQuarter.attr('data-time', this.time);
            cellsInRow.push(scheduleCellQuarter[0]);
            scheduleContainer.append(scheduleCellQuarter);
            if (cellsInRow.length == 4) {
                $(cellsInRow).wrapAll('<div class="schedule-cell"></div>');
                cellsInRow = [];
            }
        });
        emptyRow = $('<div class="schedule-cell"></div>');
        for (let i: number = 0; i < 4; i++) {
            emptyRow.append(emptyCell.clone());
        }
        scheduleContainer.append(emptyRow);
        let delay: number = 10;
        let count: number = 1;
        scheduleContainer.find($('.schedule-cell-quarter')).not($('.clone')).each(function () {
            $(this).delay(delay * count).animate({width: '25%'});
            count++;
        });
    }

    function constructLegend(container: JQuery) {
        let legendData = [{
            name: "MAC",
            section: "MA"
        }, {
            name: "Stat",
            section: "ST"
        }, {
            name: "MAC Online",
            section: "MO"
        }, {
            name: "Stat Online",
            section: "SO"
        }, {
            name: "Available",
            section: "AV"
        }, {
            name: "Unavailable",
            section: "UV"
        }];
        let legendContainer: JQuery;
        if($('.availability-btn').length > 0){
            legendContainer = container.find('.legend-column-sections > .availability-btn');
        } else {
            legendContainer = container.find('.legend-column-sections');
        }
        for (let i = 0; i < legendData.length; i++) {
            if($('.availability-btn').length > 0){
                legendContainer.before('<span>' + legendData[i].name + '</span>');
                legendContainer.before('<div class="schedule-legend-cell ' + legendData[i].section + '" data-available></div>')
            } else {
                legendContainer.append('<span>' + legendData[i].name + '</span>');
                legendContainer.append('<div class="schedule-legend-cell ' + legendData[i].section + '" data-available></div>')
            }
        }
    }

    function compareTime(hour: number, minute: number): boolean {
        let gap: number = 60 * 15 * 1000; //milliseconds for 15 minutes
        let now = new Date();
        let time = new Date();
        time.setHours(hour);
        time.setMinutes(minute);
        time.setSeconds(0);
        return now.getTime() > time.getTime() + gap;
    }

    function drawCurrentTime(element: JQuery): void {
        let dot: JQuery = $('<div class="current-time"></div>');
        element.append(dot);
    }

    function updateSelectedFilters(filters: any): void {
        if (filters) {
            let filterString: string = "";
            for (let i: number = 0; i < filters.length; i++) {
                if (i == filters.length - 1) {
                    filterString += filters[i]
                } else {
                    filterString += filters[i] + ", ";
                }
            }
            $('.selected-filter-by > p').html('<strong>Filtering By:</strong>&nbsp;&nbsp;' + filterString);
        } else {
            $('.selected-filter-by > p').html('');
        }
    }

    $(document).ready(function () {
        cellCount = $(".schedule-cell-quarter[data-row='0']").length;

        $(".input-filter").each(function (index: number, element: HTMLElement) {
            let $this: JQuery = $(this);
            let placeholder: string = "";
            let filter: string = $this.data("filter");
            $this.select2(<any>{
                "maximumSelectionLength": 4
            });
        });

        $(".input-filter").on("change", filter);
        $("span.schedule-filter-link").on("click", onFilterLink);
        $("select.schedule-filter-link").on("change", onFilterLink);

        $(window).on("resize", onWindowResize);
        onWindowResize();

        if (location.hash !== "") {
            let filters: { [key: string]: string[] } = JSON.parse(location.hash.substring(1));
            for (let name in filters) {
                $(`.input-filter[data-filter="${name}"]`).val(filters[name]).trigger("change");
            }
        }

        if ($("#schedule-palette")[0]) { // if they're allowed to select things
            // use jqueryui's selectable
            $(".schedule-box").find('.schedule').selectable({
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

        $('.side-bar-toggle').on('click', function () {
            let current = $(this).attr('data-toggle');
            $(this).attr('data-toggle', current == "false" ? "true" : "false");
            current == "false" ? $('.side-bar').addClass('enabled') : $('.side-bar').removeClass('enabled');
            $('.side-bar').hasClass('enabled') ? $(this).addClass('disabled') : $(this).removeClass('disabled');
        });

        $('html').on('click', function (e) {
            if ($(e.target).is($('.side-bar-toggle'))) return;
            if ($('.side-bar').hasClass('enabled')) {
                if ($(e.target).is($('.side-bar')) || $(e.target).is($('.side-bar').find('*')) || $(e.target).hasClass('select2-selection__choice__remove')) {
                    return;
                }
                $('.side-bar-toggle').attr('data-toggle', 'false').removeClass('disabled');
                $('.side-bar').removeClass('enabled');
            }
        });

        $('.exit').on('click', function () {
            $('.side-bar-toggle').attr('data-toggle', 'false').removeClass('disabled');
            $('.side-bar').removeClass('enabled');
        });

        $('.side-bar-link').on('click', function (e) {
            if ($(e.target).is($('.side-bar-link').find('*')) || $(e.target).hasClass('select2-selection__choice__remove')) return;
            let content = $(this).find('.link-content');
            $('.side-bar-link').each(function () {
                if ($(this).find('.link-content').is(content)) return;
                $(this).find('.link-content').removeClass('enabled');
            });
            content.hasClass('enabled') ? content.removeClass('enabled') : content.addClass('enabled');
        });

        $('.person-box-person').on('click', function () {
            let parent: JQuery = $(this).parent();
            let userID: any = $(this).attr('data-userid');
            let term: number = Number($(this).attr('data-selected-term'));
            let day: number = Number($(this).attr('data-selected-day'));
            let rowID: number = Number($(this).attr('data-rowid'));
            var that = this;
            if (parent.find('.person-box-content').css('display') == 'none') {
                $('body, html').animate({
                    scrollTop: $(that).offset().top - 50
                }, 400).promise().then(function () {
                    onEmployeeClick(userID, term, day, rowID, that);
                    constructLegend(parent);
                    parent.find('.schedule-box').addClass('loading');
                    parent.find('.person-box-content').slideDown(200);
                    $(document).bind('schedule-complete', ()=> {
                        parent.find(".schedule-cell-quarter:not(.clone)").each(onPageSetup);
                        parent.find(".schedule-cell-quarter.inactive:not(.clone)").each(onInactiveSetup);
                        parent.find('.schedule-box').removeClass('loading');
                        if (day == new Date().getDay()) {
                            let cells: JQuery = $(that).parent().find('.schedule-cell-quarter:not(.inactive, .clone)');
                            let currentTime: any;
                            cells.each(function (index, elem) {
                                let time: any = $(this).attr('data-time').split(':');
                                let hour: number = Number(time[0]);
                                let minute: number = Number(time[1]);
                                if (compareTime(hour, minute)) {
                                    currentTime = $(cells[index + 1]);
                                }
                            });
                            if (currentTime) {
                                if (currentTime.find($('.current-time')).length == 0) {
                                    drawCurrentTime(currentTime);
                                }
                            }
                        }
                    });
                });
            } else {
                parent.find('.person-box-content').slideUp(200, function () {
                    parent.find('.legend-column-sections').children().not('.availability-btn').remove();
                    parent.find('.schedule .schedule-box').children().not('.clone').remove();
                });
            }
        });
    });
}
