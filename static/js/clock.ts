import {HelperStatus} from "lib/helpers/HelperStatus";

export module clock {
    let status : HelperStatus;

    function updateTime() {
        let now : Date = new Date();
        let time : string = now.toLocaleTimeString();
        $(".time").text(time);
    }

    function onNoteSubmit() {
        let message : string = $("#input-notes").val();
        $.post("/office/post/add-log", {
            "message" : message,
            "type" : "CLOCK",
            "about" : "userid"
        }, function(data) {
            status.success("Successfully logged note");
            $("#container-note").fadeOut(function() {
                $("#container-note").addClass("hidden");
            });
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        });
    }

    function onNoteExpand() {
        let $container : JQuery = $("#container-note");
        if ($container.hasClass("hidden")) {
            $container.fadeIn();
            $container.removeClass("hidden");
        } else {
            $container.fadeOut(function(){
                $container.addClass("hidden");
            });
        }
    }

    function onClockSubmit() {
        $.post("/office/post/clock", {}, function(data) {
            status.success("Successfully clocked " + data + ".");
            $("#btn-clock").text("Clock " + (data == "in" ? "Out" : "In"));
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        });
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $("#container-note").fadeOut();
        $("#btn-clock").on("click", onClockSubmit);
        $("#btn-note").on("click", onNoteExpand);
        $("#btn-submit").on("click", onNoteSubmit);
        setInterval(updateTime, 1000);
    });
}
