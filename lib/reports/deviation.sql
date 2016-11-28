-- term,center,center
SELECT
    `Term`.`name`,
    COUNT(DISTINCT `Visit`.`student`, `Visit`.`timeIn`) AS "Visit Count",
    MAX(`CurrentVisits`.`count`) AS "Selected Term",
    COUNT(DISTINCT `Visit`.`student`, `Visit`.`timeIn`) - MAX(`CurrentVisits`.`count`) AS "Divergence From Selected Term"
FROM
    `Visit`
        LEFT JOIN `Term` ON
            `Visit`.`term` = `Term`.`id`
        LEFT JOIN `Term` AS `SelectedTerm` ON
            `SelectedTerm`.`id` = ?
        LEFT JOIN (
            SELECT
                `Visit`.`term`,
                COUNT(DISTINCT `Visit`.`student`, `Visit`.`timeIn`) AS "count"
            FROM
                `Visit`
            WHERE
                `Visit`.`center` = ? AND
                (
                    WEEKOFYEAR(CURDATE()) > WEEKOFYEAR(`Visit`.`timeIn`) OR (
                        WEEKOFYEAR(CURDATE()) = WEEKOFYEAR(`Visit`.`timeIn`) AND
                        DAYOFWEEK(CURDATE()) >= DAYOFWEEK(`Visit`.`timeIn`)
                    )
                )
            GROUP BY
                `Visit`.`term`
        ) AS `CurrentVisits` ON
            1
WHERE
    `CurrentVisits`.`term` = `SelectedTerm`.`id` AND
    (`Term`.`term` % 10) = (`SelectedTerm`.`term` % 10) AND
    `Visit`.`center` = ? AND
    (
        WEEKOFYEAR(CURDATE()) > WEEKOFYEAR(`Visit`.`timeIn`) OR (
            WEEKOFYEAR(CURDATE()) = WEEKOFYEAR(`Visit`.`timeIn`) AND
            DAYOFWEEK(CURDATE()) >= DAYOFWEEK(`Visit`.`timeIn`)
        )
    )
GROUP BY
    `Visit`.`term`
ORDER BY
    `Visit`.`term` DESC;
