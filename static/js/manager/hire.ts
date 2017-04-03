import "bootstrap-switch";
import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";
import "select2";
import "templates/modal";

import { HelperStatus } from "lib/helpers/HelperStatus";
import { HelperUrl } from "lib/helpers/HelperUrl";

export module hire {
    let status: HelperStatus;
    let modalStatus: HelperStatus;

    function addEvaluationRow(level: string, date: string, score: number): void {
        let $row: JQuery = $("<tr>");
        $row.append($("<td>").text(level));
        $row.append($("<td>").text(date));
        let $score: JQuery = $("<td>").text(score);
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

    function onFilter(): void {
        let $this: JQuery = $(this);
        HelperUrl.setParameterByName($this.data("param"), $this.val());
    }

    function onApplicantFlagChange(): void {
        $(this).closest(".applicant-row").find(".btn-update").prop("disabled", false);
    }

    function onApplicantFlagSubmit(): void {
        let flags: { [key: string]: boolean } = {};
        $(this).closest(".applicant-row").find(".input-applicant").each(function() {
            flags[this.getAttribute("data-name")] = this.checked;
        });
        $.post("/office/post/update-applicant", {
            "userid": $(this).closest(".applicant-row").data("id"),
            "flags": JSON.stringify(flags)
        }, function(data) {
            status.success("Successfully updated employee flags.");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        });
    }

    function onApplicantSave(): void {
        $.post("/office/post/update-applicant", {
            "userid": $("#modal").attr("data-id"),
            "flags": JSON.stringify({
                "notes": $("#input-notes").val()
            })
        }, function(data) {
            modalStatus.success("Successfully updated notes.");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
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
            status.success("Succesfully submitted evaluation.");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        });
    }

    function onManualHireSubmit() {
        $.post("/office/post/add-employee", {
            "userid": $("#input-hire-user").val(),
            "positions": JSON.stringify($("#input-hire-positions").val())
        }, function(data) {
            status.success("Successfully entered employee. Please edit their positions in \"Current Employees\".");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        })
    }

    function onManualApplySubmit() {
        $.post("/office/post/add-applicant", {
            "userid": $("#input-apply-user").val(),
            "positions": JSON.stringify($("#input-apply-positions").val())
        }, function(data) {
            status.success("Successfully added applicant. Please reload this page.");
        }).fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        });
    }

    function onApplicantOpen() {
        let $row: JQuery = $(this).closest(".applicant-row");
        $("#modal-positions").html("");
        $("#modal").attr("data-id", $row.data("id"));
        $("#modal-title").text($row.find(".cell-first-name").text() + " " + $row.find(".cell-last-name").text());
        let notes: string = $row.data("notes");
        $("#input-notes").html(notes ? notes : "");
        let positions: any[] = $row.data("positions");
        for (let i: number = 0; i < positions.length; i++) {
            let $positionRow: JQuery = $("<tr>");
            $positionRow.append($("<td>").text(positions[i].position));
            let lastApplied: string = new Date(positions[i].lastApplied).toLocaleDateString();
            $positionRow.append($("<td>").text(lastApplied));
            $positionRow.append($("<td>").text(positions[i].count.toString()));
            $("#modal-positions").append($positionRow);
        }

        // evaluations
        (<any>$("#input-evaluation-date")[0]).valueAsDate = new Date(); // reset to today
        $.post("/office/post/get-evaluations", {
            "userid": $row.data("id")
        }, function(data) {
            console.log(data);
            for (let i: number = 0; i < data.length; i++) {
                addEvaluationRow(
                    data[i].position,
                    new Date(data[i].date).toLocaleDateString(),
                    data[i].score
                );
            }
        }, "json").fail(function(data) {
            status.error("Error code " + data.status + " has occurred.");
        });
    }

    function setupFlagSwitches(): void {
        $(".input-applicant").bootstrapSwitch({
            "onText": "Yes",
            "offText": "No"
        });
    }

    function onPageChange() {
        setTimeout(function() {
            setupFlagSwitches();
            $(".btn-toggle-notes")
                .off("click")
                .on("click", onApplicantOpen);
            $(".btn-update")
                .off("click")
                .on("click", onApplicantFlagSubmit);
            $(".input-applicant")
                .off("switchChange.bootstrapSwitch")
                .on("switchChange.bootstrapSwitch", onApplicantFlagChange);
        }, 100);
    }

    function onPageSetup() {
        $("#input-hire-positions,#input-apply-positions").select2({
            "placeholder": "Positions"
        });
        $("#table-applicants").dataTable(<any>{
            "buttons": ["csv", "print"],
            "dom": "Blftipr",
            "order": [[2, "asc"], [1, "asc"]]
        });
        onPageChange();
        $(".input-filter").on("change", onFilter);
        $("#btn-evaluation-submit").on("click", onEvaluationSubmit);
        $("#btn-submit-hire").on("click", onManualHireSubmit);
        $("#btn-submit-apply").on("click", onManualApplySubmit);
        $("#btn-save").on("click", onApplicantSave);
    }

    $(document).ready(function() {
        status = new HelperStatus("#success", "#error");
        modalStatus = new HelperStatus("#modal-success", "#modal-error");
        onPageSetup();
        $("#table-applicants").on("draw.dt", onPageChange);
    });
}
