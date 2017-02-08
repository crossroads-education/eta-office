export class HelperTime {
    public static span15Minutes: number = 900000;

    /**
    Returns a date object for today, with the time component passed.
    The `time` argument must be a string formatted as "HH:MM", with optional ":SS" appended.
    Time must be in 24-hour format.
    */
    public static getDateFromTime(time: string): Date {
        let date: Date = new Date();
        let tokens: string[] = time.split(":");
        date.setHours(Number(tokens[0]));
        date.setMinutes(Number(tokens[1]));
        if (tokens.length > 2) {
            date.setSeconds(Number(tokens[2]));
        }
        return date;
    }
}
