import "select2";

export module front {
    function onSubmit() : void {
        let about : string = $("#input-about").val();
        let message : string = $("#input-message").val();
        $.post("/office/post/add-log", {
            "about": about,
            "message": message,
            "type": "FRONT"
        }, function() {
            $("#modal-error").html("");
            $("#modal-success").html("Successfully logged message.");
            setTimeout(function() {
                window.location.reload();
            }, 3000);
        }).fail(function(data) {
            $("#modal-success").html("");
            $("#modal-error").html("Error code " + data.status + " occurred - could not log message.");
        });
    }
    $(document).ready(function() {
        $("#input-about").select2();
        $("#btn-submit").on("click", onSubmit);
    });
}
