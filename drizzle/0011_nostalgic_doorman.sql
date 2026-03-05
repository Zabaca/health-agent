CREATE TABLE `FaxConfirm` (
	`id` text PRIMARY KEY NOT NULL,
	`jobid` text,
	`commid` text,
	`destname` text,
	`destnum` text,
	`shortstatus` text,
	`longstatus` text,
	`sendtime` text,
	`completetime` text,
	`rawBody` text,
	`createdAt` text NOT NULL
);
