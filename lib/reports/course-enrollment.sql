-- courses,term
SELECT
    CONCAT(`Course`.`subject`, ' ', `Course`.`number`) AS course,
    COUNT(DISTINCT `StudentSection`.`student`) AS count
FROM
    `StudentSection`
        LEFT JOIN `Section` ON
            `StudentSection`.`section` = `Section`.`id`
        LEFT JOIN `Course` ON
            `Section`.`course` = `Course`.`id`
WHERE
    `Course`.`id` IN (?) AND
    `Section`.`term` = ? AND
    `StudentSection`.`status` = 'E'
GROUP BY
    `Course`.`id`;
