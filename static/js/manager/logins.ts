import {HelperStatus} from "lib/helpers/HelperStatus";

export module logins {
    let status : HelperStatus;

    function onAddSubmit() {
        let params : {[key : string] : any} = {};
        $(".input-add").each(function(index : number, element : HTMLElement) {
            let $this : JQuery = $(this);
            params[$this.data("name")] = $this.val();
        });
        $.post("/office/post/update-login", params, function(data) {
            status.success("Successfully added login data.");
            $(".input-add").val("");
            let $row : JQuery = $("#row-template").clone();
            $row.removeClass("hidden");
            $row.attr("id", "");
            $row.find(".cell-name").text(params["name"]);
            $row.find(".input-username").val(params["username"])
            $row.find(".input-password").data("value", params["password"]);
            setupRowHandlers($row);
            $("#table-logins").append($row);
        }).fail(function(data) {
            status.error("Failed to add login data.");
        });
    }

    function onValueToggle() {
        let $password : JQuery = $(this).closest("tr").find(".input-password");
        let isHidden : boolean = $password.data("hidden") == "yes";
        if (isHidden) { // need to show
            $password.val($password.data("value"));
            $password.prop("disabled", false);
        } else { // need to hide
            $password.data("value", $password.val());
            $password.val("********");
            $password.prop("disabled", true);
        }
        $password.data("hidden", isHidden ? "no" : "yes");
    }

    function onUpdateSubmit() {
        let $row = $(this).closest("tr");
        let name : string = $row.find(".cell-name").text();
        let username : string = $row.find(".input-username").val();
        let $password : JQuery = $row.find(".input-password");
        let password : string = $password.data("hidden") == "yes" ? $password.data("value") : $password.val();
        $.post("/office/post/update-login", {
            "name": name,
            "username": username,
            "password": password
        }, function(data) {
            status.success("Successfully updated " + name);
        }).fail(function(data) {
            status.error("Failed to update " + name + ": error code " + data.status);
        });
    }

    function onDeleteSubmit() {
        let $row : JQuery = $(this).closest("tr");
        let name : string = $row.find(".cell-name").text();
        if (!confirm("Are you sure you want to delete " + name + "?")) {
            return;
        }
        $.post("/office/post/delete-login", {
            "name": name
        }, function(data) {
            status.success("Successfully deleted " + name);
            $row.remove();
        }).fail(function(data) {
            status.error("Failed to delete " + name + ": error code " + data.status);
        });
    }

    function setupRowHandlers($parent : JQuery) {
        $parent.find(".btn-toggle").on("click", onValueToggle);
        $parent.find(".btn-update").on("click", onUpdateSubmit);
        $parent.find(".btn-delete").on("click", onDeleteSubmit);
    }

    $(document).ready(function() {
        status = new HelperStatus("#success-add", "#error-add");
        $(".input-add").on("keyup", function(evt : Event) {
            if ((<any>evt).which === 13) {
                onAddSubmit.apply(this);
            }
        });
        $("#btn-submit-add").on("click", onAddSubmit);
        setupRowHandlers($(document.body));
    });
}
