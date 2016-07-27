import {HelperUrl} from "../lib/helpers/HelperUrl.js";

export module employees {
    function onEmployeeOpen() : void {
        let $this : JQuery = $(this);
        let name : string = $this.find(".employee-name").text();
        let photoUrl : string = $this.find(".employee-photo").attr("src");
        $("#modal-title").text(name);
        $("#modal-photo").attr("src", photoUrl);
    }
    $(document).ready(function() {
        $("select.input-filter").on("change", function() {
            let $this : JQuery = $(this);
            HelperUrl.setParameterByName($this.attr("data-filter"), $this.val());
        });
        $("img.employee-photo").each(function(index : number, element : HTMLImageElement) {
            $(element).on("error", function() {
                $(this).attr("src", "https://mac.iupui.edu/img/MissingPhotos.svg");
            });
            element.src = "https://mac.iupui.edu/img/team-xsmall/" + $(element).data("username") + ".jpg";
        });
        $("div.employee-block").on("click", onEmployeeOpen);
    });
}
