import "datatables.net";
import "datatables.net-bs";

export module dev {
    function setupRow($row: JQuery): void {
        let message: string = $row.find(".cell-message").html();
        message = message.replace(/\#([\d]+)/g, "<a href='https://github.com/crossroads-education/eta-office/issues/$1'>#$1</a>");
        $row.find(".cell-message").html(message);
    }

    $(document).ready(function() {
        $("#table-commits tbody tr").each(function(index: number, element: HTMLElement) {
            setupRow($(element));
        });
        $("#table-commits").DataTable(<any>{
            "order": [[0, "desc"]]
        });
    });
}
