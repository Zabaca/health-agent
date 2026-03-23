ALTER TABLE `Provider` ADD `benefitsCoverage` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `claimsPayment` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `eligibilityEnrollment` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `financialBilling` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `medicalRecords` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `dentalRecords` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `otherNonSpecific` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `otherNonSpecificDesc` text;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveCommDiseases` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveReproductiveHealth` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveHivAids` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveMentalHealth` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveSubstanceUse` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitivePsychotherapy` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveOther` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `Provider` ADD `sensitiveOtherDesc` text;
