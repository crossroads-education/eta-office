-- center,start,end,start,end
SELECT
	`Person`.`firstName` AS "First Name",
	`Person`.`lastName` AS "Last Name",
	ROUND(SUM(
		TIME_TO_SEC(`EmployeeTimesheet`.`timeOut`) -
		TIME_TO_SEC(`EmployeeTimesheet`.`timeIn`)
	) / 3600, 2) AS "Hours",
	GROUP_CONCAT(DISTINCT `Position`.`name` SEPARATOR ', ') AS "Positions",
	`Person`.`id` AS "Employee ID"
FROM
	`EmployeeTimesheet`
		LEFT JOIN `Employee` ON
			`EmployeeTimesheet`.`id` = `Employee`.`id`
		LEFT JOIN `Person` ON
			`EmployeeTimesheet`.`id` = `Person`.`id`
		LEFT JOIN `EmployeePosition` ON
			`EmployeeTimesheet`.`id` = `EmployeePosition`.`id`
		LEFT JOIN `Position` ON
			`EmployeePosition`.`position` = `Position`.`id`
WHERE
	`Employee`.`current` = 1 AND
	`Position`.`center` = ? AND
	`Position`.`active` = 1 AND
	`EmployeePosition`.`start` <= ? AND
	(
		`EmployeePosition`.`end` IS NULL OR
		`EmployeePosition`.`end` >= ?
	) AND
	DATE(`EmployeeTimesheet`.`timeIn`) >= DATE(?) AND
	DATE(`EmployeeTimesheet`.`timeOut`) <= DATE(?)
GROUP BY
	`Person`.`id`;