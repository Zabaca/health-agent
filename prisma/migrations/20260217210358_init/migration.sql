-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "mailingAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ssn" TEXT NOT NULL,
    "authExpirationDate" TEXT,
    "authExpirationEvent" TEXT,
    "authPrintedName" TEXT NOT NULL,
    "authSignatureImage" TEXT,
    "authDate" TEXT NOT NULL,
    "authAgentName" TEXT,
    CONSTRAINT "Release_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "providerName" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "patientMemberId" TEXT,
    "groupId" TEXT,
    "planName" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "providerEmail" TEXT,
    "address" TEXT,
    "membershipIdFront" TEXT,
    "membershipIdBack" TEXT,
    "historyPhysical" BOOLEAN NOT NULL DEFAULT false,
    "diagnosticResults" BOOLEAN NOT NULL DEFAULT false,
    "treatmentProcedure" BOOLEAN NOT NULL DEFAULT false,
    "prescriptionMedication" BOOLEAN NOT NULL DEFAULT false,
    "imagingRadiology" BOOLEAN NOT NULL DEFAULT false,
    "dischargeSummaries" BOOLEAN NOT NULL DEFAULT false,
    "specificRecords" BOOLEAN NOT NULL DEFAULT false,
    "specificRecordsDesc" TEXT,
    "dateRangeFrom" TEXT,
    "dateRangeTo" TEXT,
    "allAvailableDates" BOOLEAN NOT NULL DEFAULT false,
    "purpose" TEXT,
    "purposeOther" TEXT,
    CONSTRAINT "Provider_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
