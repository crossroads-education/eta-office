/// <reference path="../typings/index.d.ts"/>
import * as moment from "moment";
import {HelperUrl} from "../lib/helpers/HelperUrl.js";

export module employees {
    function onEmployeeOpen() : void {
        $("#modal-positions").html("");
        let $this : JQuery = $(this);
        let $data : JQuery = $this.find(".employee-data");
        let name : string = $this.find(".employee-name").text();
        let photoUrl : string = $this.find(".employee-photo").attr("src");
        let positions : any[] = $data.data("positions");
        $("#modal-title").text(name);
        $("#modal-photo").attr("src", photoUrl);
        $("#modal-positions").attr("data-employee", $this.attr("data-id"));
        for (let i : number = 0; i < positions.length; i++) {
            let startDate : moment.Moment = moment(positions[i].start);
            let endDate : moment.Moment = moment(positions[i].end);
            let $row = $("<tr>");
            $row.addClass("position-row");
            $row.append($("<td>").text(positions[i].name));
            $row.append($("<td>").text(positions[i].category));
            $row.append($("<td>").append($("<input type='date'>").addClass("position-start").attr("value", startDate.format("YYYY-MM-DD"))));
            $row.append($("<td>").append($("<input type='date'>").addClass("position-end").attr("value", endDate.format("YYYY-MM-DD"))));
            $("#modal-positions").append($row);
        }
    }
    $(document).ready(function() {
        $("select.input-filter").on("change", function() {
            let $this : JQuery = $(this);
            HelperUrl.setParameterByName($this.attr("data-filter"), $this.val());
        });
        $("img.employee-photo").each(function(index : number, element : HTMLImageElement) {
            $(element).on("error", function() {
                $(this).attr("src", "https://mac.iupui.edu/img/MissingPhotos.svg");
            });
            element.src = "https://mac.iupui.edu/img/team-xsmall/" + $(element).data("username") + ".jpg";
        });
        $("div.employee-block").on("click", onEmployeeOpen);
    });
}
