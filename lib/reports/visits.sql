-- id,id
SELECT
    TIME(`Visit`.`timeIn`) AS "Sign-In Time",
    IF(
        `Visit`.`timeOut` IS NOT NULL,
        TIME(`Visit`.`timeOut`),
        "N/A"
    ) AS "Sign-Out Time",
    GROUP_CONCAT(DISTINCT CONCAT(`Course`.`subject`, ' ', `Course`.`number`) SEPARATOR ', ') AS "Course(s)"
FROM
    `Visit`
        LEFT JOIN `Person` ON
            `Visit`.`student` = `Person`.`id`
        RIGHT JOIN `Section` ON
            `Visit`.`section` REGEXP `Section`.`id`
        LEFT JOIN `Course` ON
            `Section`.`course` = `Course`.`id`
WHERE
    (
        `Person`.`username` = ? OR
        `Person`.`id` = ?
    )
GROUP BY `Visit`.`student`, `Visit`.`timeIn`, `Visit`.`section`;
