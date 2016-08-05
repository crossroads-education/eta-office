import "bootstrap-switch";
import {HelperStatus} from "lib/helpers/HelperStatus";

export module positions {
    let status : HelperStatus;

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error")
        $(".input-toggle").bootstrapSwitch();
        $(".input-toggle").on("switchChange.bootstrapSwitch", function(event, state) {
            $(this).attr("data-changed", "true");
            console.log(this);
        });
        $("#btn-submit").on("click", function() {
            let changed : {[ key : string ] : boolean } = {};
            let count : number = 0;
            $(".input-toggle[data-changed='true']").each(function(index : number, element : HTMLElement) {
                changed[$(element).data("position")] = <any>$(element).bootstrapSwitch("state");
                count += 1;
            });
            console.log(changed);
            if(count == 0){
                status.error("Please edit a value before submission.");
            }else{
                $.post("/office/post/update-position", {
                    "positions": JSON.stringify(changed)
                }, function(data) {
                    status.success("Successfully changed positions");
                }).fail(function(data) {
                    status.error("Error code " + data.status + " has occured");
                });
            }
        });
    });
}
