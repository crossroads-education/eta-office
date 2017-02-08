import "templates/modal";

export module policies {
    $(document).ready(function() {
        $(".collapsible-body > ul > li").each(function(index: number, element: HTMLElement){
            let $li : JQuery = $(element);
            let $p : JQuery = $li.find("p");
            if ($p.length > 0) {
                $p.addClass("list-dashed");
            }
            else {
                $li.addClass("list-dashed");
            }
        });
    });
}
