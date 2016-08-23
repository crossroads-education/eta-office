import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";

export module system {
    $(document).ready(function() {
        $("#table-log").dataTable();
    });
}
