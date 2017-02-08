interface ScheduleCell {
    /**
    The center code the cell is scheduled for (null if none is scheduled)
    */
    center: string;

    /**
    Whether the cell is available or not
    */
    isAvailable: boolean;

    /**
    Hour component of cell time (24-hours)
    */
    hour: number;

    /**
    Minute component of cell time
    */
    minute: number;
}

export default ScheduleCell;
