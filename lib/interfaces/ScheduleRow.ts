import ScheduleCell from "./ScheduleCell";

interface ScheduleRow {
    id: string;
    firstName?: string;
    lastName?: string;
    dayTotalHours: number;
    weekTotalHours: number;
    positionNames?: string[];
    positionCategories?: string[];
    // sorted by time ascending
    cells: ScheduleCell[];
}

export default ScheduleRow;
