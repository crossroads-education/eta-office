-- center,term
SELECT
    CONCAT(`Person`.`firstName`, ' ', `Person`.`lastName`) AS "Student Name",
    `Person`.`username` AS "Student Username",
    COUNT(DISTINCT `Visit`.`student`, `Visit`.`timeIn`) AS "Visit Count"
FROM
    `Visit`
        LEFT JOIN `Person` ON
            `Visit`.`student` = `Person`.`id`
WHERE
    `Visit`.`center` = ? AND
    `Visit`.`term` = ?
GROUP BY
    `Visit`.`student`
ORDER BY
    `Person`.`firstName`,
    `Person`.`lastName`
