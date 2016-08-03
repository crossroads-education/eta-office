export module clock {
    function updateTime(){
        let now : Date = new Date();
        let time : string = now.toLocaleTimeString();
        $(".time").html(time);
    }

    $(document).ready(function() {
        $("#btn-clock").on("click", function() {
            $.post("/office/post/clock", {}, function(data) {
                $("#success").text(data == "in" ? "Successfully clocked in." : "Successfully clocked out.");
                setTimeout(function () {
                    window.location.reload();
                }, 3000);
            }).fail(function(data) {
                $("#error").text("Error code " + data.status + " has occured.");
            })
        });
        setInterval(updateTime, 1000);
    });
}
