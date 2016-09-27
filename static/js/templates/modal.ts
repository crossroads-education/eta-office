export module modal {
    function setupModalCollapsible() {
        $(".collapsible-parent").each(function(index: number, element: HTMLElement) {
            let $this: JQuery = $(this);
            let $body: JQuery = $(this).find(".collapsible-body");
            $body.collapse();
            $body.on("hide.bs.collapse", function() {
                $this.find(".glyphicon").removeClass("glyphicon-minus collapsible-rotate-minus").addClass("glyphicon-plus collapsible-rotate-plus");
            });
            $body.on("show.bs.collapse", function() {
                $this.find(".glyphicon").removeClass("glyphicon-plus collapsible-rotate-plus").addClass("glyphicon-minus collapsible-rotate-minus");
            });
            $this.find(".collapsible-header").on("click", function() {
                $body.collapse("toggle");
            });
            $body.collapse("hide");
        });
    }

    $(document).ready(function() {
        setupModalCollapsible();
    });
}
