-- Refactor user roles: collapse all non-admin types into 'user'.
-- Agent privilege is now tracked via ZabacaAgentRole table.
-- PDA access is already tracked via PatientDesignatedAgent table.

CREATE TABLE `ZabacaAgentRole` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL UNIQUE REFERENCES `User`(`id`) ON DELETE CASCADE,
  `createdAt` text NOT NULL
);
-->statement-breakpoint
-- Backfill: promote all existing 'agent' users into ZabacaAgentRole BEFORE type is changed
INSERT INTO ZabacaAgentRole (id, userId, createdAt)
SELECT lower(hex(randomblob(16))), id, createdAt
FROM User WHERE type = 'agent';
-->statement-breakpoint
-- Convert all non-admin users to 'user' type
UPDATE User SET type = 'user' WHERE type != 'admin';
