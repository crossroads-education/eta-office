-- term,department,positions
SELECT
    CONCAT(`firstName`, ' ', `lastName`) AS "Name",
    `hours` AS "Hours Scheduled",
    CONCAT('$', ROUND(`totalPay`, 2)) AS "Weekly Expenditure"
FROM
    (
        SELECT
            GROUP_CONCAT(DISTINCT `Person`.`firstName`) AS "firstName",
            GROUP_CONCAT(DISTINCT `Person`.`lastName`) AS "lastName",
            `Position`.`name` AS "position",
            (COUNT(`EmployeeSchedule`.`time`) / 4) * `PositionPayrate`.`payrate` AS "totalPay",
            COUNT(`EmployeeSchedule`.`time`) / 4 AS "hours"
        FROM
            `EmployeeSchedule`
                LEFT JOIN `EmployeePosition` ON
                    `EmployeeSchedule`.`id` = `EmployeePosition`.`id`
                LEFT JOIN `Person` ON
                    `EmployeePosition`.`id` = `Person`.`id`
                LEFT JOIN `Position` ON
                    `EmployeePosition`.`position` = `Position`.`id`
                LEFT JOIN `PositionPayrate` ON
                    `Position`.`name` = `PositionPayrate`.`position`
                LEFT JOIN `Center` ON
                    `Position`.`center` = `Center`.`id`
                LEFT JOIN `Term` ON
                    `EmployeeSchedule`.`term` = `Term`.`id`
        WHERE
            NOT `Position`.`category` IN ('Mentor', 'Graduate') AND
            `EmployeePosition`.`start` < `Term`.`end` AND
            (
                `EmployeePosition`.`end` IS NULL OR
                `EmployeePosition`.`end` > `Term`.`start`
            ) AND
            `EmployeeSchedule`.`term` = ? AND
            `Center`.`department` = ? AND
            `EmployeeSchedule`.`center` >= 0 AND
            `PositionPayrate`.`payrate` IS NOT NULL AND
            `Position`.`name` IN (?) AND
            NOT (
                `Position`.`category` = 'Management' AND
                `Position`.`name` != 'Assistant Manager'
            )
        GROUP BY `Position`.`name`, `Position`.`category`, `Person`.`id`
    ) AS `t1`
ORDER BY
    `firstName` ASC,
    `lastName` ASC,
    `totalPay` DESC
