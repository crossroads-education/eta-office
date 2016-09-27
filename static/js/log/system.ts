import "datatables.net";
import "datatables.net-bs";
import "datatables.net-buttons";
import "datatables.net-buttons-bs";
import "datatables.net-buttons-html5";
import "datatables.net-buttons-print";
import * as moment from "moment";

export module system {

    function fixTimeCell() {
        let $this: JQuery = $(this);
        let time: string = moment($this.text(), ["h:mm:ss A"]).format("HH:mm:ss");
        $this.text(time);
    }

    $(document).ready(function() {
        $("#table-log .cell-time").each(fixTimeCell);
        $("#table-log").dataTable(<any>{
            "order": [[0, "desc"]]
        });
    });
}
