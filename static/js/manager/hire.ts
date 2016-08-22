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

    function addEvaluationRow(level : string, date : string, score : number) : void {
        let $row : JQuery = $("<tr>");
        $row.append($("<td>").text(level));
        $row.append($("<td>").text(date));
        let $score : JQuery = $("<td>").text(score);
        if (score >= 60) {
            $score.addClass("score-good");
        } else if (score >= 50) {
            $score.addClass("score-neutral");
        } else {
            $score.addClass("score-bad");
        }
        $row.append($score);
        $("#modal-evaluations").append($row);
    }

    function onFilter() {
        let $this : JQuery = $(this);
        HelperUrl.setParameterByName($this.data("param"), $this.val());
    }

    function onApplicantFlagChange() {
        $(this).closest(".applicant-row").find(".btn-update").prop("disabled", false);
    }

    function onApplicantFlagSubmit(){
        let flags : {[key : string] : boolean} = {};
        $(this).closest(".applicant-row").find(".input-applicant").each(function() {
            flags[this.getAttribute("data-name")] = this.checked;
        })
        $.post("/office/post/update-applicant", {
            "userid": $(this).closest(".applicant-row").data("id"),
            "flags": JSON.stringify(flags)
        }, function(data) {
            status.success("Successfully updated employee flags")
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occured");
        });
    }

    function onEvaluationSubmit() {
        addEvaluationRow(
            $("#input-evaluation-level").val(),
            $("#input-evaluation-date").val(),
            Number($("#input-evaluation-score").val())
        );

        $.post("/office/post/add-evaluation", {
            "userid": $("#modal").data("id"),
            "level": $("#input-evaluation-level").val(),
            "date": $("#input-evaluation-date").val(),
            "score": $("#input-evaluation-score").val()

        }, function(data) {
            status.success("Succesfully submitted evulation")
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occured");
        });
    }

    function onManualHireSubmit() {
        $.post("/office/post/add-employee", {
            "userid": $("#input-user").val()
        }, function(data) {
            status.success("Successfully entered employee. Please edit position in Current Employees")
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occured");
        })
    }
    function onApplicantOpen() {
        let $row : JQuery = $(this).closest(".applicant-row");
        $("#modal-positions").html("");
        $("#modal").attr("data-id", $row.data("id"));
        $("#modal-title").text($row.find(".cell-first-name").text() + " " + $row.find(".cell-last-name").text());
        let positions : any[] = $row.data("positions");
        for (let i : number = 0; i < positions.length; i++) {
            let $positionRow : JQuery = $("<tr>");
            $positionRow.append($("<td>").text(positions[i].position));
            let lastApplied : string = new Date(positions[i].lastApplied).toLocaleDateString();
            $positionRow.append($("<td>").text(lastApplied));
            $positionRow.append($("<td>").text(positions[i].count.toString()));
            $("#modal-positions").append($positionRow);
            if (positions[i].evalScore) {
                addEvaluationRow(
                    positions[i].position,
                    new Date (positions[i].evalDate).toLocaleDateString(),
                    positions[i].evalScore
                )
            }
        }

        // evaluations

        (<any>$("#input-evaluation-date")[0]).valueAsDate = new Date(); // reset to today

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
        $("#btn-evaluation-submit").on("click", onEvaluationSubmit);
        $(".btn-update").on("click", onApplicantFlagSubmit);
        $(".input-applicant").on("change", onApplicantFlagChange);
        $("#btn-submit-hire").on("click", onManualHireSubmit);
    });
}
