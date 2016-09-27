import { HelperStatus } from "lib/helpers/HelperStatus";
import { HelperUrl } from "lib/helpers/HelperUrl";

export module centers {
    let status: HelperStatus;

    function onSubmit(): void {
        let term: string = $("#input-term").val();
        let center: string = $("#input-center").val();
        let hours: { open: string, close: string }[] = [];
        $("tr[data-day]").each(function(index: number, element: HTMLElement) {
            let $row: JQuery = $(this);
            hours[$row.data("day")] = {
                "open": $row.find(`[data-type="open"]`).val(),
                "close": $row.find(`[data-type="close"]`).val()
            };
        });
        let centerName: string = $(`#input-center option[value="${center}"]`).text();
        $.post("/office/post/update-center", {
            "term": term,
            "center": center,
            "hours": JSON.stringify(hours)
        }, function(data) {
            status.success(`Successfully updated "${centerName}"`);
        }).fail(function(data) {
            status.error(`Failed to update "${centerName}"`);
        });
    }

    function onFilter(): void {
        let $this: JQuery = $(this);
        HelperUrl.setParameterByName($this.data("param"), $this.val());
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $("#btn-submit").on("click", onSubmit);
        $("select.input-filter").on("change", onFilter);
    });
}
