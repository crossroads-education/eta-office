-- center,term
SELECT
    `Person`.`lastName` AS "Last Name",
    `Person`.`firstName` AS "First Name",
    -- CONCAT(`Person`.`lastName`, ' ', `Person`.`firstName`) AS "Student Name",
    `Person`.`username` AS "Username",
    GROUP_CONCAT(DISTINCT CONCAT(`Course`.`subject`, ' ', `Course`.`number`, ' ', `Section`.`number`) ORDER BY `Course`.`subject`, `Course`.`number`, `Section`.`number`) AS "Sections",
    `VisitTotals`.`count` AS "Visit Count",
    IFNULL(
        `VisitTotals`.`duration`,
        "0.00"
    ) AS "Total Visit Duration (Hours)"
FROM
    (
        SELECT
            `Visit`.`student`,
            `Visit`.`center`,
            `Visit`.`term`,
            COUNT(DISTINCT `Visit`.`student`, `Visit`.`timeIn`) AS "count",
            ROUND(SUM(TIME_TO_SEC(TIMEDIFF(`Visit`.`timeOut`, `Visit`.`timeIn`))) / 3600, 2) AS "duration"
        FROM
            `Visit`
        WHERE
            `Visit`.`center` = ? AND
            `Visit`.`term` = ?
        GROUP BY
            `Visit`.`student`
    ) AS `VisitTotals`
        LEFT JOIN `Person` ON
            `VisitTotals`.`student` = `Person`.`id`
        RIGHT JOIN `StudentSection` ON
            `VisitTotals`.`student` = `StudentSection`.`student`
        RIGHT JOIN `Section` ON
            `StudentSection`.`section` = `Section`.`id`
        RIGHT JOIN `Course` ON
            `Section`.`course` = `Course`.`id`
WHERE
    `Section`.`term` = `VisitTotals`.`term` AND
    `Course`.`center` = `VisitTotals`.`center`
GROUP BY
    `VisitTotals`.`student`
ORDER BY
    `Person`.`lastName`,
    `Person`.`firstName`
