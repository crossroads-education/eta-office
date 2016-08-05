import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";

import "templates/modal";

import {HelperStatus} from "lib/helpers/HelperStatus";
import {HelperUrl} from "lib/helpers/HelperUrl";

export module hire {
    let status : HelperStatus;

    function onFilter() {
        let $this : JQuery = $(this);
        HelperUrl.setParameterByName($this.data("param"), $this.val());
    }

    function onApplicantOpen() {
        let $row : JQuery = $(this).closest(".applicant-row");
        $("#modal-positions").html("");
        $("#modal-title").text($row.find(".cell-first-name").text() + " " + $row.find(".cell-last-name").text());
        let positions : {
            position : string,
            lastApplied : string,
            count : number
        }[] = $row.data("positions");
        for (let i : number = 0; i < positions.length; i++) {
            let $positionRow : JQuery = $("<tr>");
            $positionRow.append($("<td>").text(positions[i].position));
            let lastApplied : string = new Date(positions[i].lastApplied).toLocaleDateString();
            $positionRow.append($("<td>").text(lastApplied));
            $positionRow.append($("<td>").text(positions[i].count.toString()));
            $("#modal-positions").append($positionRow);
        }
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        $("#table-applicants").dataTable(<any>{
            "buttons": ["csv", "print"],
            "dom": "Blftipr",
            "order": [[1, "asc"], [2, "asc"]]
        });
        $(".input-filter").on("change", onFilter);
        $(".btn-toggle-notes").on("click", onApplicantOpen);
    });
}
