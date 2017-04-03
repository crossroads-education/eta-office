/// <reference path="../typings/index.d.ts"/>

import "listjs";
declare var List : any;

export module recommendation {
    $(document).ready(function() {
        let options = {
            valueNames: ["recommendee-label", "recommender-label", "position-label", "eval-label"]
        }
        let userList = new List("content-container", options);
        $(".container-tab").on("click", function(){
            $(".hire-list").each(function(){
                $(this).removeClass("list");
            });
            $($(this).attr("href")).find("ul").addClass("list");
            userList = new List("content-container", options);
        });
    });
}
