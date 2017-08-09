import "bootstrap-slider";
import "bootstrap-switch";

export module profile {

    function onInfoSubmit() {
        var params: { [key: string]: string } = {};
        $("#info-container .info-field").each(function() {
            let name: string = this.getAttribute("name");
            if (name == null) {
                return;
            }
            let value: string = $(this).val();
            if ($(this).hasClass("info-slider")) {
                let valueTokens: string[] = this.getAttribute("data-value").split(",");
                name = name.substring(0, 1).toUpperCase() + name.substring(1);
                params["min" + name] = valueTokens[0];
                params["max" + name] = valueTokens[1];
                return;
            } else if (this.getAttribute("type") == "checkbox") {
                value = (this.checked ? 1 : 0).toString();
            }
            params[name] = value;
        });
        $.post("/office/post/update-profile", params, function(data) {
            $("#errors").addClass("hidden");
            $("#success").removeClass("hidden");
            window.scrollTo(0, 0);
        }, "json").fail(function(err) {
            $("#success").addClass("hidden");
            $("#errors").text(`Error code ${err.status} occurred. Please contact a developer.`);
            $("#errors").removeClass("hidden");
            window.scrollTo(0, 0);
        });
    }

    $(document).ready(function() {
        (<any>$("#hours-slider")).bootstrapSlider({});
        $("input.info-field[type='text']").on("keydown", function(evt) {
            if (evt.which == 13) {
                onInfoSubmit.apply(this);
            }
        });
        $("input.info-field[type='checkbox']").each(function(index: number, element: HTMLElement) {
            let $element: JQuery = $(element);
            $element.bootstrapSwitch({
                "state": $element.prop("checked")
            });
        });
        $("button.iu-button[type='submit']").on("click", onInfoSubmit);
    });
}
