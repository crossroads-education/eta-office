import "bootstrap-switch";
import { HelperStatus } from "lib/helpers/HelperStatus";

export module positions {
    let status: HelperStatus;

    function onSubmit() {
        let changed: { [key: string]: boolean } = {};
        let count: number = 0;
        $(".input-toggle[data-changed='true']").each(function(index: number, element: HTMLElement) {
            changed[$(element).data("position")] = <any>$(element).bootstrapSwitch("state");
            count++;
        });
        if (count === 0) {
            status.error("Please toggle a position before submission.");
            return;
        }
        $.post("/office/post/update-position", {
            "positions": JSON.stringify(changed)
        }, function(data) {
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
        $("#btn-submit").on("click", onSubmit);
    });
}
