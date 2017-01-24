/// <reference path="../typings/index.d.ts"/>

import "bootstrap";
import "bootstrap-switch";
import "datatables.net";
import "datatables.net-bs";
import "templates/modal";
import * as moment from "moment";
import { timesheet } from "templates/timesheet";

import { HelperStatus } from "lib/helpers/HelperStatus";
import { HelperUrl } from "lib/helpers/HelperUrl";

export module employees {

    interface NetworkEmployeePosition {
        id: number;
        start: string;
        end: string;
    }

    interface EmployeePosition extends NetworkEmployeePosition {
        name: string;
        category: string;
    }

    interface Log {
        about: string;
        author: string;
        message: string;
        timestamp: string;
        type: string;
    }

    let modalStatus: HelperStatus;

    function addPositionRow(position: EmployeePosition): void {
        let startDate: moment.Moment = moment(position.start);
        let endDate: moment.Moment = moment(position.end);
        let $row = $("<tr>");
        $row.addClass("position-row");
        $row.attr("data-id", position.id);
        $row.append($("<td>").addClass("position-name").text(position.name));
        $row.append($("<td>").addClass("position-category").text(position.category));
        $row.append($("<td>").append($("<input type='date'>").addClass("position-start").attr("value", startDate.format("YYYY-MM-DD"))));
        $row.append($("<td>").append($("<input type='date'>").addClass("position-end").attr("value", endDate.format("YYYY-MM-DD"))));
        $("#modal-positions").append($row);
    }

    function addPermissionRow(permission: string): void {
        let $row = $("<tr>");
        $row.addClass("permission-row");
        $row.append($("<td>").addClass("permission-name").text(permission));
        let $deleteButton = $("<span>").addClass("glyphicon glyphicon-minus-sign");
        $deleteButton.on("click", function(): void {
            $.post("/office/post/remove-permission", {
                id: $("#modal-positions").attr("data-employee"),
                permission: permission
            });
            $row.remove();
        });
        $row.append($("<td>").addClass("permission-remove").append($deleteButton));
        $("#modal-permissions").append($row);
    }

    function addLogRow(log: Log): void {
        let $row: JQuery = $("<tr>");
        let timestamp: Date = new Date(log.timestamp);
        let category: string = log.type;
        if (category == "FRONT") {
            category = "Front Desk";
        } else if (category == "CLOCK") {
            category = "Timesheet";
        } else if (category == "MANGR") {
            category = "Manager";
        }
        $row.append($("<td>").text(timestamp.toLocaleString()));
        $row.append($("<td>").text(log.author));
        $row.append($("<td>").text(log.message));
        $row.append($("<td>").text(category));
        $("#table-log").prepend($row);
    }

    function onEmployeeOpen(): void {
        $("#modal-positions, #modal-permissions, #table-log").html("");
        let $this: JQuery = $(this);
        let $data: JQuery = $this.find(".employee-data");
        let name: string = $this.find(".employee-name").text();
        let photoUrl: string = $this.find(".employee-photo").attr("src");
        let positions: any[] = $data.data("positions");
        let permissions: string[] = $data.data("permissions");
        let allowances: { [key: string]: boolean } = $data.data("allowances");
        let userid: string = $this.attr("data-id");
        $("#modal-title").text(name);
        $("#modal-photo").attr("src", photoUrl);
        $("#modal-positions").attr("data-employee", userid);
        $("#input-nametag-id").val(userid);
        $("#output-notes").text($data.attr("data-notes"));
        let timesheetRows: timesheet.TimesheetRow[] = $data.data("timesheet");
        timesheet.table.fnClearTable();
        for (let i: number = 0; i < timesheetRows.length; i++) {
            timesheet.addRow(timesheetRows[i]);
        }
        timesheet.table.fnDraw();
        for (let name in allowances) {
            $(`input.modal-allowance[data-name="${name}"]`).bootstrapSwitch("state", allowances[name]);
        }
        if ($data.data("mentor") >= 0) {
            $("#mentor-container").removeClass("hidden");
            $("#input-mentor").val($data.data("mentor"));
        } else {
            $("#mentor-container").addClass("hidden");
        }
        for (let i: number = 0; i < positions.length; i++) {
            addPositionRow(positions[i]);
        }
        for (let i: number = 0; i < permissions.length; i++) {
            addPermissionRow(permissions[i]);
        }
        $.post("/office/post/get-log", {
            "userid": userid
        }, function(log) {
            for (let i: number = 0; i < log.length; i++) {
                addLogRow(log[i]);
            }
        }, "json").fail(function(data) {
            modalStatus.error("Couldn't fetch log info: " + data.status);
        });
    }

    function onPositionAdd() {
        let $select: JQuery = $("#select-position");
        let $selected: JQuery = $select.find(`option[value="${$select.val()}"]`);
        addPositionRow({
            "id": $select.val(),
            "start": null,
            "end": null,
            "name": $selected.data("name"),
            "category": $selected.data("category")
        });
    }

    function onPermissionAdd() {
        addPermissionRow($("#input-permission").val());
    }

    function onSave() {
        $("#modal-error").html("");
        let errorMessage: string = "";
        let positions: NetworkEmployeePosition[] = [];
        $("#modal-positions .position-row").each(function(index: number, element: HTMLElement) {
            let $this: JQuery = $(this);
            let id: number = $this.data("id");
            let startDate: string = $this.find(".position-start").val();
            let endDate: string = $this.find(".position-end").val();
            if (startDate == "") {
                let name: string = $this.find(".position-name").text();
                let category: string = $this.find(".position-category").text();
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
        let permissions: string[] = [];
        $("#modal-permissions .permission-row").each(function(index: number, element: HTMLElement) {
            permissions.push($(this).find(".permission-name").text());
        });
        let allowances: { [key: string]: boolean } = {};
        $("input.modal-allowance").each(function(index: number, element: HTMLElement) {
            let $this: JQuery = $(this);
            allowances[$this.data("name")] = <any>$this.bootstrapSwitch("state");
        });
        let mentor: number = -1;
        if (!$("#mentor-container").hasClass("hidden")) {
            mentor = $("#input-mentor").val();
        }
        if (errorMessage != "") {
            $("#modal-error").html(errorMessage);
            return;
        }
        $.post("/office/post/update-employee", {
            "id": $("#modal-positions").attr("data-employee"),
            "positions": JSON.stringify(positions),
            "allowances": JSON.stringify(allowances),
            "mentor": mentor,
            "permissions": JSON.stringify(permissions)
        }, function(data) {
            modalStatus.success("Successfully updated employee data.");
        }).fail(function(data) {
            modalStatus.error("Error code " + data.status + " occurred.");
        });
    }

    function onLogSubmit(): void {
        let message: string = $("#input-log-message").val();
        $.post("/office/post/add-log", {
            "about": $("#modal-positions").attr("data-employee"),
            "message": message,
            "type": "MANGR"
        }, function(log: Log) {
            addLogRow(log);
            modalStatus.success("Successfully submitted new log entry.");
        }, "json").fail(function(data) {
            modalStatus.error("Error code " + data.status + " occurred.");
        });
    }

    function onImageSetup(index: number, element: HTMLImageElement): void {
        $(element).on("error", function() {
            $(this).attr("src", "https://mac.iupui.edu/img/missing-photo.svg");
        });
        element.src = "https://mac.iupui.edu/img/team-xsmall/" + $(element).data("username") + ".jpg";
    }

    function onFilter() {
        let $this: JQuery = $(this);
        HelperUrl.setParameterByName($this.attr("data-filter"), $this.val());
    }

    function setupModalInputs() {
        $("input.modal-allowance").bootstrapSwitch();
        $("input.modal-allowance + span").on("click", function() {
            let $checkbox: JQuery = $(this).prev();
            $checkbox.bootstrapSwitch("toggleState");
        });
    }

    $(document).ready(function() {
        modalStatus = new HelperStatus("#modal-success", "#modal-error");
        $("select.input-filter").on("change", onFilter);
        $("img.employee-photo").each(onImageSetup);
        $("#btn-position-add").on("click", onPositionAdd);
        $("#btn-permission-add").on("click", onPermissionAdd);
        $("#btn-save").on("click", onSave);
        $("#input-log-message").on("keyup", function(evt: any) {
            if (evt.which == 13) {
                onLogSubmit();
            }
        });
        $("#btn-submit-log").on("click", onLogSubmit);
        setupModalInputs();
        // don't set up click listener until everything's ready
        $("div.employee-block").on("click", onEmployeeOpen);
    });
}
