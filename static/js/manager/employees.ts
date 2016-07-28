/// <reference path="../typings/index.d.ts"/>
import * as moment from "moment";
import {HelperUrl} from "../lib/helpers/HelperUrl.js";

export module employees {

    interface NetworkEmployeePosition {
        id : number;
        start : string;
        end : string;
    }

    interface EmployeePosition extends NetworkEmployeePosition {
        name : string;
        category : string;
    }

    function addPositionRow(position : EmployeePosition) : void {
        let startDate : moment.Moment = moment(position.start);
        let endDate : moment.Moment = moment(position.end);
        let $row = $("<tr>");
        $row.addClass("position-row");
        $row.attr("data-id", position.id);
        $row.append($("<td>").addClass("position-name").text(position.name));
        $row.append($("<td>").addClass("position-category").text(position.category));
        $row.append($("<td>").append($("<input type='date'>").addClass("position-start").attr("value", startDate.format("YYYY-MM-DD"))));
        $row.append($("<td>").append($("<input type='date'>").addClass("position-end").attr("value", endDate.format("YYYY-MM-DD"))));
        $("#modal-positions").append($row);
    }

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
            addPositionRow(positions[i]);
        }
    }

    function onPositionAdd() {
        let $select : JQuery = $("#select-position");
        let $selected : JQuery = $select.find(`option[value="${$select.val()}"]`);
        addPositionRow({
            "id": $select.val(),
            "start": null,
            "end": null,
            "name": $selected.data("name"),
            "category": $selected.data("category")
        });
    }

    function onPositionSave() {
        $("#modal-error").html("");
        let errorMessage : string = "";
        let positions : NetworkEmployeePosition[] = [];
        $("#modal-positions .position-row").each(function(index : number, element : HTMLElement) {
            let $this : JQuery = $(this);
            let id : number = $this.data("id");
            let startDate : string = $this.find(".position-start").val();
            let endDate : string = $this.find(".position-end").val();
            if (startDate == "") {
                let name : string = $this.find(".position-name").text();
                let category : string = $this.find(".position-category").text();
                errorMessage += `Position ${name} (${category}) cannot have an empty start date.<br/>`;
            }
            if (endDate == "") {
                endDate = null;
            }
            positions.push({
                "id": id,
                "start": startDate,
                "end": endDate
            });
        });
        if (errorMessage != "") {
            $("#modal-error").html(errorMessage);
            return;
        }
        $.post("/office/post/update-employee-position", {
            "id": $("#modal-positions").data("employee"),
            "positions": JSON.stringify(positions)
        }, function(data) {
            $("#modal-success").html("Successfully updated positions.");
        }).fail(function(data) {
            $("#modal-error").html("Error code " + data.status + " occurred.");
        });
    }

    function onImageSetup(index : number, element : HTMLImageElement) : void {
        $(element).on("error", function() {
            $(this).attr("src", "https://mac.iupui.edu/img/MissingPhotos.svg");
        });
        element.src = "https://mac.iupui.edu/img/team-xsmall/" + $(element).data("username") + ".jpg";
    }

    function onFilter() {
        let $this : JQuery = $(this);
        HelperUrl.setParameterByName($this.attr("data-filter"), $this.val());
    }

    function setupModalCollapsible() {
        $(".collapsible-parent").each(function(index : number, element : HTMLElement) {
            let $this : JQuery = $(this);
            let $body : JQuery = $(this).find(".collapsible-body");
            (<any>$body).collapse();
            $body.on("hide.bs.collapse", function() {
                $this.find(".glyphicon").removeClass("glyphicon-minus").addClass("glyphicon-plus");
            });
            $body.on("show.bs.collapse", function() {
                $this.find(".glyphicon").removeClass("glyphicon-plus").addClass("glyphicon-minus");
            });
            $this.find(".collapsible-header").on("click", function() {
                (<any>$body).collapse("toggle");
            });
            (<any>$body).collapse("hide");
        });
    }

    $(document).ready(function() {
        $("select.input-filter").on("change", onFilter);
        $("img.employee-photo").each(onImageSetup);
        $("div.employee-block").on("click", onEmployeeOpen);
        $("#btn-position-add").on("click", onPositionAdd);
        $("#btn-position-save").on("click", onPositionSave);
        setupModalCollapsible();
    });
}
