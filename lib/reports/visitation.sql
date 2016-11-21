-- term,tutor
SELECT
    CONCAT(`Course`.`subject`, ' ', `Course`.`number`) AS "Course",
    `Section`.`number` AS "Section",
    `Section`.`room` AS "Location",
    CONCAT(`Professor`.`lastName`, ', ', `Professor`.`firstName`) AS "Professor",
    `Section`.`days` AS "Days",
    CONCAT(`Section`.`start`, ' - ', `Section`.`end`) AS "Time"
FROM
    `Section`
        LEFT JOIN `Course` ON
            `Section`.`course` = `Course`.`id`
        LEFT JOIN `Person` AS `Professor` ON
            `Section`.`professor` = `Professor`.`id`
WHERE
    `Course`.`supported` = 1 AND
    `Section`.`term` = ? AND
    `Course`.`tutor` = ?
ORDER BY
    `Course`.`subject` ASC,
    `Course`.`number` ASC,
    `Section`.`number` ASC
