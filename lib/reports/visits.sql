-- id,id
SELECT
    DATE_FORMAT(`Visit`.`timeIn`, '%b %e, %Y') AS "Date",
    DATE_FORMAT(`Visit`.`timeIn`, GET_FORMAT(TIME, 'USA')) AS "Sign-In Time",
    IF(
        `Visit`.`timeOut` IS NOT NULL,
        DATE_FORMAT(`Visit`.`timeOut`, GET_FORMAT(TIME, 'USA')),
        "N/A"
    ) AS "Sign-Out Time",
    IF(
        `Visit`.`timeOut` IS NOT NULL,
        TRUNCATE(TIMESTAMPDIFF(MINUTE, `Visit`.`timeIn`, `Visit`.`timeOut`) / 60, 2),
        0
    ) AS "Duration (Hours)",
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
GROUP BY
    `Visit`.`student`,
    `Visit`.`timeIn`,
    `Visit`.`section`
ORDER BY `Visit`.`timeIn` DESC;
