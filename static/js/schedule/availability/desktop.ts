import "schedule/desktop";

export module schedule_availability_desktop {
    function onSubmit(): void {
        let changedCells: JQuery = $(`.schedule-cell[data-selected]`);

    }

    $(document).ready(function() {
        $(".btn-submit").on("click", onSubmit);
    });
}
