-- term
SELECT
    `Course`.`subject` AS "Course Subject",
    `Course`.`number` AS "Course Number",
    `Section`.`number` AS "Section Number",
    `Section`.`room` AS "Room",
    CONCAT(`Professor`.`lastName`, ', ', `Professor`.`firstName`) AS "Professor",
    `Section`.`totalEnrolled` AS "Enrollment Count",
    `Section`.`days` AS "Days",
    `Section`.`start` AS "Start Time",
    `Section`.`end` AS "End Time"
FROM
    `Section`
        LEFT JOIN `Course` ON
            `Section`.`course` = `Course`.`id`
        LEFT JOIN `Person` `Professor` ON
            `Section`.`professor` = `Professor`.`id`
WHERE
    `Course`.`supported` = 1 AND
    `Section`.`term` = ?
