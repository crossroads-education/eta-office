export module clock {
    function updateTime(){
        let now : Date = new Date();
        let time : string = now.toLocaleTimeString();
        $(".time").html(time);
    }

    $(document).ready(function() {
        $("#btn-clock").on("click", function() {
            $.post("/office/post/clock", {}, function(data) {
                alert(data == "in" ? "Successfully clocked in." : "Successfully clocked out.");
                window.location.reload();
            })
        });
        setInterval(updateTime, 1000);
    });
}
