export class HelperStatus {
    private $success : JQuery;
    private $error : JQuery;

    public constructor(successSelector : string, errorSelector : string) {
        this.$success = $(successSelector);
        this.$error = $(errorSelector);
        this.$success.addClass("text-success");
        this.$error.addClass("text-danger");
    }

    public success(message : string) : void {
        this.$error.text("");
        this.$success.text(message);
    }

    public error(message : string) : void {
        this.$success.text("");
        this.$error.text(message);
    }
}
