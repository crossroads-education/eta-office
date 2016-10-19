-- term
SELECT
    CONCAT(`Person`.`lastName`, ', ', `Person`.`firstName`) AS "Name",
    `Person`.`id` AS "Student ID",
    COUNT(*) / 4 AS "Hours"
FROM
    `Employee`
        LEFT JOIN `Person` ON
            `Employee`.`id` = `Person`.`id`
        LEFT JOIN `EmployeeSchedule` ON
            `Employee`.`id` = `EmployeeSchedule`.`id`
WHERE
    `EmployeeSchedule`.`center` != -1 AND
    `EmployeeSchedule`.`term` = ?
GROUP BY `Employee`.`id`
ORDER BY
    `Person`.`lastName` ASC,
    `Person`.`firstName` ASC
