/**
Parent models must define "usePermissions": true in their JSON file.
There are some variables that must be implemented by the parent model.
scheduleRowType : string; // "person" | "day"
scheduleRows : eta.Row[]; // schedule data
scheduleFilters : {
    day : number; // 0-6 day (0=Sunday)
    sort : string; // see "sortables" for possible values
    position : string; // position name
    category : string; // position category
    term : number; // term ID
};
scheduleLocationPalette : {[name : string] : centerCode}; // for editing
scheduleMode : string; // "manager" | "availability" | "view"
scheduleHours : string[]; // hours available to view/edit in schedule (format: HHa|p)
*/

/*
Template model provides:
schedulePositionNames : string[];
schedulePositionCategories : string[];
scheduleTerms : Term[];
permissions : PermissionUser;
*/

/**
Represents a group of slots with some metadata.
Can be a person or a day.
*/
export interface Row {
    /**
    If this represents a person, their ID
    */
    userid? : string;

    /**
    Person: name
    Day: full day name (Monday, Tuesday...)
    */
    label : string;

    /**
    Values to check filters against.
    */
    filterables : {[key : string] : any};

    /**
    Sum of scheduled time for this row in hours (decimal possible)
    */
    total : number;

    /**
    Indexes: hour (from 0), minutes / 15 (0, 15, 30, 45)
    */
    slots : Slot[][];

    /**
    If the row has any available slots
    */
    isAvailable : boolean;

    /**
    If the row has any scheduled slots (center != -1)
    */
    isScheduled : boolean;
}

/**
Represents a 15-minute segment within a hour.
*/
export interface Slot {
    /**
    Center ID. If not scheduled, should be -1.
    Can be center code - if not scheduled, should be UV or AV. Empty slots should be UV.
    */
    center : number | string;

    /**
    Whether this is marked available
    */
    isAvailable : boolean;

    /**
    Format: HH:MM:SS
    Seconds should always be 0.
    Minutes should always be a multiple of 15, 0 <= minutes <= 45
    */
    time : string;
}

export function getEmptyHour() {
    let emptyHour : Slot[] = [];
    for (let i : number = 0; i < 4; i++) {
        emptyHour.push({
            "isAvailable": false,
            "center": -1,
            "time": "00:00:00"
        });
    }
    return emptyHour;
}
