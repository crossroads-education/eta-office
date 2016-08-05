export class HelperStatus {
    private $success : JQuery;
    private $error : JQuery;

    public constructor(successSelector : string, errorSelector : string) {
        this.$success = $(successSelector);
        this.$error = $(errorSelector);
        this.$success.fadeOut();
        this.$error.fadeOut();
        this.$success.addClass("text-success hidden");
        this.$error.addClass("text-danger hidden");
    }

    private fadeOut($element : JQuery, callback : () => void) : void {
        $element.fadeOut(200, function() {
            $element.addClass("hidden");
            callback();
        });
    }

    public success(message : string) : void {
        this.fadeOut(this.$error, () => {
            this.$success.removeClass("hidden").fadeIn().text(message);
        });
    }

    public error(message : string) : void {
        this.fadeOut(this.$success, () => {
            this.$error.removeClass("hidden").fadeIn().text(message);
        });
    }
}
