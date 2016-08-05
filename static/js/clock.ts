import {HelperStatus} from "lib/helpers/HelperStatus";

export module clock {
    let status : HelperStatus;

    function updateTime(){
        let now : Date = new Date();
        let time : string = now.toLocaleTimeString();
        $(".time").html(time);
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error")
        $("#container-note").fadeOut();
        $("#btn-clock").on("click", function() {
            $.post("/office/post/clock", {}, function(data) {
                status.success(data == "in" ? "Successfully clocked in." : "Successfully clocked out.");
                setTimeout(function () {
                    window.location.reload();
                }, 3000);
            }).fail(function(data) {
                status.error("Error code " + data.status + " has occured.");
            });
        });
        $("#btn-note").on("click", function() {
            let container : JQuery = $("#container-note");
            if(container.hasClass("hidden")) {
                container.fadeIn();
                container.removeClass("hidden");
            }else{
                container.fadeOut(function(){
                    container.addClass("hidden");
                });
            }
        });
        $("#btn-submit").on("click", function() {
            let message : string = $("#input-notes").val();
            $.post("/office/post/add-log", {
                "message" : message,
                "type" : "CLOCK",
                "about" : "userid"
            }, function(data) {
                status.success("Successfully logged note");
                $("#container-note").fadeOut(function(){
                    $("#container-note").addClass("hidden");
                });
            }).fail(function(data) {
                status.error("Error code " + data.status + " has occured.");
            });
        });
        setInterval(updateTime, 1000);
    });
}
