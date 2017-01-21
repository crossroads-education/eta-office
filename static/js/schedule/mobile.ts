import "schedule/global";

export module schedule_mobile {
    function toggleSidebar(isToggled?: boolean): void {
        let $toggle: JQuery = $(".sidebar-toggle");
        let $container: JQuery = $(".sidebar-container");
        if (isToggled === undefined) {
            isToggled = $toggle.attr("data-toggled") === "true";
        }
        $toggle.attr("data-toggled", (!isToggled).toString());
        if (isToggled) {
            $container.removeClass("enabled");
            $toggle.removeClass("disabled");
        } else {
            $container.addClass("enabled");
            $toggle.addClass("disabled");
        }
    }

    function onSidebarLinkToggle(evt: JQueryEventObject): void {
        let $target: JQuery = $(evt.target);
        if ($target.is($(".sidebar-link-container").find("*")) ||
            $target.hasClass("select2-selection__choice__remove")) {
            return;
        }
        let $content: JQuery = $(this).find(".sidebar-link-content");
        $(".sidebar-link-content").not($content).removeClass("enabled");
        $content.toggleClass("enabled");
    }

    function onScheduleBoxToggle(): void {
        let $box: JQuery = $(this).parent();
        let $content: JQuery = $box.find(".schedule-box-body");
        if ($content.css("display") == "none") {
            $content.slideDown(200);
        } else {
            $content.slideUp(200);
        }
    }

    $(document).ready(function() {
        $(".sidebar-toggle").on("click", function() {
            toggleSidebar();
        });
        $(document.body).on("click", function(evt: JQueryEventObject) {
            let $target: JQuery = $(evt.target);
            if ($target.hasClass("sidebar-toggle") ||
                !$(".sidebar-container").hasClass("enabled") ||
                $target.hasClass("sidebar-container") ||
                $target.closest(".sidebar-container").length > 0 ||
                $target.hasClass("select2-selection__choice__remove")) {
                return;
            }
            toggleSidebar(true);
        });
        $(".sidebar-exit").on("click", function() {
            toggleSidebar(true);
        });
        $(".sidebar-link-container").on("click", onSidebarLinkToggle);
        $(".schedule-box-header").on("click", onScheduleBoxToggle);
    });
}
