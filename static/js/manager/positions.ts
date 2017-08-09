import "bootstrap-switch";
import { HelperStatus } from "lib/helpers/HelperStatus";
import "templates/modal";

export module positions {
    let status: HelperStatus;

    function onSubmit() {
        let $parent : JQuery = $(this).closest(".collapsible-body");
        let params: any = {
            "active" : $parent.find("input[data-name='active']").bootstrapSwitch("state"),
            "open" : $parent.find("input[data-name='open']").bootstrapSwitch("state"),
            "visible" : $parent.find("input[data-name='visible']").bootstrapSwitch("state"),
            id : $(this).attr("data-id")
        };
        console.log(params);
        $.post("/office/post/update-position", params, function(data) {
            status.success("Successfully changed positions");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred");
        });
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $(".input-toggle").bootstrapSwitch().on("switchChange.bootstrapSwitch", function(event: Event, state: string) {
            $(this).attr("data-changed", "true");
        });
        $(".btn-submit").on("click", onSubmit);
    });
}
