ALTER TABLE `IncomingFile` ADD COLUMN `userProviderId` text REFERENCES UserProvider(id) ON DELETE SET NULL;
