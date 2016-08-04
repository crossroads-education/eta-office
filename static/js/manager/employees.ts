/// <reference path="../typings/index.d.ts"/>

import "bootstrap";
import "templates/modal";
import * as moment from "moment";

import {HelperUrl} from "lib/helpers/HelperUrl";

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
        let allowances : {[key : string] : boolean} = $data.data("allowances");
        $("#modal-title").text(name);
        $("#modal-photo").attr("src", photoUrl);
        $("#modal-positions").attr("data-employee", $this.attr("data-id"));
        console.log(allowances);
        for (let name in allowances) {
            $(`input.modal-allowance[data-name="${name}"]`).prop("checked", allowances[name]);
        }
        if ($data.data("mentor") >= 0) {
            $("#mentor-container").removeClass("hidden");
            $("#input-mentor").val($data.data("mentor"));
        } else {
            $("#mentor-container").addClass("hidden");
        }
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

    function onSave() {
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
        let allowances : {[key : string] : boolean} = {};
        $("input.modal-allowance").each(function(index : number, element : HTMLElement) {
            let $this : JQuery = $(this);
            allowances[$this.data("name")] = $this.prop("checked");
        });
        let mentor : number = -1;
        if (!$("#mentor-container").hasClass("hidden")) {
            mentor = $("#input-mentor").val();
        }
        if (errorMessage != "") {
            $("#modal-error").html(errorMessage);
            return;
        }
        $.post("/office/post/update-employee", {
            "id": $("#modal-positions").data("employee"),
            "positions": JSON.stringify(positions),
            "allowances": JSON.stringify(allowances),
            "mentor": mentor
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

    function setupModalInputs() {
        $("input.modal-allowance + span").on("click", function() {
            let $this : JQuery = $(this);
            let $checkbox : JQuery = $this.prev();
            $checkbox.prop("checked", !$checkbox.prop("checked"));
        });
    }

    $(document).ready(function() {
        $("select.input-filter").on("change", onFilter);
        $("img.employee-photo").each(onImageSetup);
        $("#btn-position-add").on("click", onPositionAdd);
        $("#btn-save").on("click", onSave);
        setupModalInputs();
        // don't set up click listener until everything's ready
        $("div.employee-block").on("click", onEmployeeOpen);
    });
}
