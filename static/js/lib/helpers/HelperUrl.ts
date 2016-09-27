export class HelperUrl {
    // used and modified from http://stackoverflow.com/a/5158301
    public static getParameterByName(name: string): string {
        var match = RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    }
    public static setParameterByName(rawName: string, rawValue: string): void {
        let name: string = encodeURIComponent(rawName);
        let value: string = encodeURIComponent(rawValue);
        if (document.location.search == "") { // no existing query string
            document.location.search = `?${name}=${value}`;
            return;
        }
        let tokens: string[] = document.location.search.substr(1).split("&");
        let i: number;
        for (i = 0; i < tokens.length; i++) {
            let param: string[] = tokens[i].split("=");
            if (param[0] == name) { // already exists
                param[1] = value;
                tokens[i] = param.join("=");
                break;
            }
        }
        if (i == tokens.length) { // doesn't already exist
            tokens.push(`${name}=${value}`);
        }
        document.location.search = "?" + tokens.join("&");
    }
}
