import "select2";
import { HelperUrl } from "lib/helpers/HelperUrl";

export module schedule_global {
    let isFilterChanging: boolean = false;

    function onFilterSubmit(this: HTMLInputElement): void {
        let value: string = this.value;
        if (value === undefined) {
            value = this.getAttribute("data-value");
        }
        HelperUrl.setParameterByName(this.getAttribute("data-name"), value);
    }

    function onHashSubmit(this: HTMLElement): void {
        if (!isFilterChanging) {
            isFilterChanging = true;
            $(`.schedule-hash-input[data-name='${$(this).attr("data-name")}']`).not($(this)).val($(this).val()).trigger("change");
            isFilterChanging = false;
        }
        filter();
    }

    function filter(): void {
        let shouldFilter: boolean = false;
        let selectors: { [key: string]: string[] } = {};
        let filters: { [key: string]: string[] } = {};
        $(".schedule-hash-input").each(function(index: number, element: HTMLElement) {
            let name: string = $(element).attr("data-name");
            let values: string[] = $(element).val();
            if (!values || values.length == 0) {
                return;
            }
            shouldFilter = true;
            for (let i: number = 0; i < values.length; i++) {
                if (!selectors[name]) {
                    selectors[name] = [];
                }
                selectors[name].push(`[data-${name}*='${values[i]}']`);
            }
            filters[name] = values;
        });
        if (!shouldFilter) {
            location.hash = "";
            $(".schedule-row-filterable").show();
            return;
        }
        location.hash = "#" + JSON.stringify(filters);
        let $toShow: JQuery = $(".schedule-row-filterable");
        let final: string = "";
        for (let i in selectors) {
            let selector: string = selectors[i].join(",");
            $toShow = $toShow.filter(selector);
        }
        let notSelector: string = ".schedule-row-filterable";
        $toShow.each(function(index: number, element: HTMLElement) {
            let userid: string = $(element).attr("data-id");
            notSelector += `:not([data-id='${userid}'])`;
        });
        $(notSelector).hide();
        $toShow.show();
    }

    function setupHashInputs(parent: JQuery): void {
        if (location.hash.length > 1) {
            let hashData: { [key: string]: any } = JSON.parse(location.hash.substring(1));
            for (let name in hashData) {
                parent.find(`.schedule-hash-input[data-name='${name}']`).val(hashData[name]).trigger("change");
            }
        }
    }

    function onLoad(this: HTMLElement): void {
        $(this).find("select.schedule-filter-input").on("change", onFilterSubmit);
        $(this).find("button.schedule-filter-input").on("click", onFilterSubmit);
        $(this).find("span.schedule-filter-link").on("click", onFilterSubmit);
        $(this).find("select.schedule-hash-input").on("change", onHashSubmit);
        $(this).find(".schedule-filter-select2").each(function(index: number, element: HTMLElement) {
            let $element: JQuery = $(element);
            let placeholder: string = $element.attr("data-placeholder");
            $element.select2(<any>{
                "maximumSelectionLength": 4,
                "placeholder": placeholder ? placeholder : ""
            });
        });
        setupHashInputs($(this));
    }

    $(document).ready(function() {
        $(document.body).on("scrollHead.loaded", function() {
            $("#fixed-head").find(".select2-container").remove();
            onLoad.apply(document.getElementById("fixed-head"));
        });
        onLoad.apply(document.body);
        $(document).trigger("schedule.loaded", "global");
    });
}
