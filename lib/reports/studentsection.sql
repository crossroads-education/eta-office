-- id,id
SELECT
    CONCAT(`Course`.`subject`, ' ', `Course`.`number`) AS "Course",
    `Term`.`name` AS "Term",
    `Section`.`number` AS "Section Number",
    CONCAT(`Professor`.`firstName`, ' ', `Professor`.`lastName`) AS "Professor",
    CONCAT(`Section`.`days`, ', ', `Section`.`start`, ' - ', `Section`.`end`) AS "Time",
    `Section`.`meetingType` AS "Meeting Type",
    `StudentSection`.`status` AS "Enrollment Status"
FROM
    `StudentSection`
        LEFT JOIN `Person` `Student` ON
            `StudentSection`.`student` = `Student`.`id`
        LEFT JOIN `Section` ON
            `StudentSection`.`section` = `Section`.`id`
        LEFT JOIN `Course` ON
            `Section`.`course` = `Course`.`id`
        LEFT JOIN `Term` ON
            `Section`.`term` = `Term`.`id`
        LEFT JOIN `Person` `Professor` ON
            `Section`.`professor` = `Professor`.`id`
WHERE
    (
        `Student`.`username` = ? OR
        `Student`.`id` = ?
    )
ORDER BY
    `Term`.`id` DESC,
    `Course`.`subject` ASC,
    `Course`.`number` ASC,
    `Section`.`meetingType` ASC;
