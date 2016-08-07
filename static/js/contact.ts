/// <reference path="./typings/index.d.ts"/>
import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";

export module contact {
    $(document).ready(function() {
        $("#employees").dataTable(<any>{
            "pageLength": 25,
            "order": [[0, "asc"], [1, "asc"]],
            "dom": 'Blfrtip',
            "buttons": ['csv', 'print']
        });
    });
}
