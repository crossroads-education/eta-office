/// <amd-dependency path="./templates/schedule.js"/>

export module availability {
    function onSubmit() : void {
        let params : {[key : string] : any} = {
            "term": $("#schedule-term").val(),
            "cells": []
        };
        $(".schedule-cell-quarter[data-changed]").each(function(index : number, element : HTMLElement) {
            let $this : JQuery = $(this);
            let day : string = $this.closest(".schedule-cell-row").attr("data-day");
            let time : string = $this.attr("data-time");
            let location : string = $this.attr("data-previous-color");
            params["cells"].push({
                "day": day,
                "time": time,
                "isAvailable": location == "AV"
            });
            $this.removeAttr("data-changed");
        });
        params["cells"] = JSON.stringify(params["cells"]);
        console.log(params);
        $.post("/office/post/update-availability", params, function(data) {
            $("#schedule-error").addClass("hidden");
            $("#schedule-message").text("Successfully updated availability.").removeClass("hidden");
        }).fail(function(data) {
            $("#schedule-message").addClass("hidden");
            $("#schedule-error").text("Error status " + data.status + " occurred.").removeClass("hidden");
        });
    }

    $(document).ready(function() {
        $(".btn-schedule-submit").on("click", onSubmit);
    });
}
