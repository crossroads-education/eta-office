import "bootstrap-switch";
import { HelperStatus } from "lib/helpers/HelperStatus";
import "templates/modal";

export module positions {
    let status: HelperStatus;

    function onSubmit() {
        let $parent : JQuery = $(this).closest(".collapsible-body");
        let params: any = {
            "active" : $parent.find("input[data-name='active']").bootstrapSwitch("state"),
            "open" : $parent.find("input[data-name='open']").bootstrapSwitch("state"),
            "visible" : $parent.find("input[data-name='visible']").bootstrapSwitch("state"),
            id : $(this).attr("data-id")
        };
        console.log(params);
        $.post("/office/post/update-position", params, function(data) {
            status.success("Successfully changed positions");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred");
        });
    }

    function onFilter() {
        $("#filter-error").addClass("hidden");
        let filters: string[] = [];
        filters.push($("#filter-names").val());
        filters.push($("#filter-categories").val());
        $(".row.position").each(function() {
            let position: string = $(this).find(".collapsible-parent").text().split("\n")[1].trim();
            if((position.indexOf(filters[0]) != -1 || filters[0] === "All") && (position.indexOf(filters[1]) != -1 || filters[0] === "All")) {
                $(this).removeClass("hidden");
            } else {
                $(this).addClass("hidden");
            }
        });
        if($(".position").not(".hidden").length === 0) {
            $("#filter-error").removeClass("hidden");
            $(".position").each(function() {
                $(this).removeClass("hidden");
            });
            $("#filter-names").val("");
            $("#filter-categories").val("");
        }
    }

    function setFilters() {
        let $this: JQuery = $(this);
        let positionNames: string[] = [];
        let positionCategories: string[] = [];
        $(".position").each(function() {
            let $data: JQuery = $(this).find(".position-data");
            if (positionNames.indexOf($data.data("name")) === -1) {
                positionNames.push($data.data("name"));
            }
            if (positionCategories.indexOf($data.data("category")) === -1) {
                positionCategories.push($data.data("category"));
            }
        });
        for (let i in positionNames) {
            let option: HTMLOptionElement = document.createElement("option");
            option.text = JSON.parse(positionNames[i]);
            $("#filter-names").append(option);
        };
        for (let i in positionCategories) {
            let option: HTMLOptionElement = document.createElement("option");
            option.text = JSON.parse(positionCategories[i]);
            $("#filter-categories").append(option);
        };
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $("select.input-filter").on("change", onFilter);
        $(".input-toggle").bootstrapSwitch().on("switchChange.bootstrapSwitch", function(event: Event, state: string) {
            $(this).attr("data-changed", "true");
        });
        setFilters();
        $(".btn-submit").on("click", onSubmit);
    });
}
