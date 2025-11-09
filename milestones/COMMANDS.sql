-- =========================================================
-- PET ADOPTION & CARE PORTAL
-- =========================================================

/*
    SECTION 1: CREATE DATABASE
*/
CREATE DATABASE IF NOT EXISTS PetAdoption;
USE PetAdoption;


/*
    SECTION 2: DDL - CREATE TABLES
*/

-- 1. ---------- USER ----------
CREATE TABLE UserAccount (
    userID INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(30),
    role ENUM('ADOPTER', 'STAFF', 'VET', 'ADMIN') NOT NULL,

    PRIMARY KEY (userID)
);


-- 2. ---------- SHELTER ----------
CREATE TABLE Shelter (
    shelterID INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(100) NOT NULL,
    phone VARCHAR(30),

    PRIMARY KEY (shelterID)
);


-- 3. ---------- PET ----------
CREATE TABLE Pet (
    petID INT UNSIGNED AUTO_INCREMENT,
    shelterID INT UNSIGNED NOT NULL,
    name VARCHAR(100),
    species VARCHAR(50),
    breed VARCHAR(50),
    sex ENUM('M', 'F', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    dob DATE,
    status ENUM('AVAILABLE', 'HOLD', 'ADOPTED') NOT NULL DEFAULT 'AVAILABLE',
    intakeDate DATE NOT NULL,

    PRIMARY KEY (petID),
    CONSTRAINT FK_PET_SHELTER
        FOREIGN KEY (shelterID) REFERENCES Shelter(shelterID)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- 4. ---------- VACCINE ----------
CREATE TABLE Vaccine (
    vaccineID INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL UNIQUE,

    PRIMARY KEY (vaccineID)
);


-- 5. ---------- PETVACCINE (JUNCTION) ----------
CREATE TABLE PetVaccine (
    petID INT UNSIGNED NOT NULL,
    vaccineID INT UNSIGNED NOT NULL,
    vaccineDate DATE NOT NULL,
    lotNo VARCHAR(64) NOT NULL,

    PRIMARY KEY (petID, vaccineID, vaccineDate),
    CONSTRAINT FK_PV_PET FOREIGN KEY (petID)
        REFERENCES Pet(petID)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_PV_VACCINE FOREIGN KEY (vaccineID)
        REFERENCES Vaccine(vaccineID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- 6. ---------- ADOPTION ----------
CREATE TABLE Adoption (
    adoptionID INT UNSIGNED AUTO_INCREMENT,
    petID INT UNSIGNED NOT NULL,
    adopterID INT UNSIGNED NOT NULL,
    status ENUM('APPLIED', 'APPROVED', 'FINALIZED', 'REJECTED', 'CANCELED') NOT NULL,
    applicationDate DATETIME,
    approvalDate DATETIME,
    finalizationDate DATETIME,

    PRIMARY KEY (adoptionID),
    CONSTRAINT FK_ADOPT_PET FOREIGN KEY (petID)
        REFERENCES Pet(petID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_ADOPT_ADOPTER FOREIGN KEY (adopterID)
        REFERENCES UserAccount(userID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT UQ_PET_FINALIZED UNIQUE (petID, finalizationDate)
);


-- 7. ---------- APPOINTMENT ----------
CREATE TABLE Appointment (
    appointmentID INT UNSIGNED AUTO_INCREMENT,
    petID INT UNSIGNED NOT NULL,
    adopterID INT UNSIGNED NOT NULL,
    shelterID INT UNSIGNED NOT NULL,
    appointmentTime DATETIME NOT NULL,
    appointmentType ENUM('VISIT', 'MEET&GREET', 'VET') NOT NULL,

    PRIMARY KEY (appointmentID),
    CONSTRAINT FK_APPT_PET FOREIGN KEY (petID)
        REFERENCES Pet(petID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_APPT_ADOPTER FOREIGN KEY (adopterID)
        REFERENCES UserAccount(userID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_APPT_SHELTER FOREIGN KEY (shelterID)
        REFERENCES Shelter(shelterID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- 8. ---------- CARELOG ----------
CREATE TABLE CareLog (
    careID INT UNSIGNED AUTO_INCREMENT,
    petID INT UNSIGNED NOT NULL,
    staffID INT UNSIGNED NOT NULL,
    careDate DATETIME NOT NULL,
    careType VARCHAR(80) NOT NULL,
    notes TEXT,

    PRIMARY KEY (careID),
    CONSTRAINT FK_CL_PET FOREIGN KEY (petID)
        REFERENCES Pet(petID)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_CL_STAFF FOREIGN KEY (staffID)
        REFERENCES UserAccount(userID)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- 9. ---------- PAYMENT ----------
CREATE TABLE Payment (
    paymentID INT UNSIGNED AUTO_INCREMENT,
    adopterID INT UNSIGNED NOT NULL,
    adoptionID INT UNSIGNED,
    appointmentID INT UNSIGNED,
    amount DECIMAL(10,2) NOT NULL,
    paymentDate DATETIME NOT NULL,
    paymentMethod ENUM('CASH', 'CARD') NOT NULL,
    status ENUM('PENDING', 'COMPLETED', 'REFUNDED') DEFAULT 'PENDING',

    PRIMARY KEY (paymentID),
    CONSTRAINT FK_PAY_ADOPTER FOREIGN KEY (adopterID)
        REFERENCES UserAccount(userID)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PAY_ADOPT FOREIGN KEY (adoptionID)
        REFERENCES Adoption(adoptionID)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT FK_PAY_APPT FOREIGN KEY (appointmentID)
        REFERENCES Appointment(appointmentID)
        ON UPDATE CASCADE ON DELETE SET NULL
);


-- 10. ---------- BREED ----------
CREATE TABLE Breed (
    breedID INT UNSIGNED AUTO_INCREMENT,
    species VARCHAR(50) NOT NULL,
    breedName VARCHAR(100) NOT NULL,
    size ENUM('SMALL', 'MEDIUM', 'LARGE') DEFAULT 'MEDIUM',
    lifespan VARCHAR(30),
    temperament VARCHAR(255),

    PRIMARY KEY (breedID),
    UNIQUE (species, breedName)
);

-- ----------------------------------------


/*
 * Section 3: Inserts
*/

CREATE PROCEDURE sp_seed_data()
BEGIN
  SET FOREIGN_KEY_CHECKS=0;
  TRUNCATE TABLE Payment;
  TRUNCATE TABLE CareLog;
  TRUNCATE TABLE Appointment;
  TRUNCATE TABLE PetVaccine;
  TRUNCATE TABLE Adoption;
  TRUNCATE TABLE Vaccine;
  TRUNCATE TABLE Pet;
  TRUNCATE TABLE Breed;
  TRUNCATE TABLE Shelter;
  TRUNCATE TABLE UserAccount;
  SET FOREIGN_KEY_CHECKS=1;

  -- 1) Users (10)  -> 5 adopters, 3 staff, 2 vets
  INSERT INTO UserAccount(name,email,phone,role) VALUES
  ('Alex Carter','alex@example.com','555-1001','ADOPTER'),
  ('Bri Chen','bri@example.com','555-1002','ADOPTER'),
  ('Chris Diaz','chris@example.com','555-1003','ADOPTER'),
  ('Dana Fox','dana@example.com','555-1004','ADOPTER'),
  ('Eli Gomez','eli@example.com','555-1005','ADOPTER'),
  ('Sam Patel','sam@example.com','555-2001','STAFF'),
  ('Taylor Kim','taylor@example.com','555-2002','STAFF'),
  ('Jordan Lee','jlee@example.com','555-2003','STAFF'),
  ('Dr. Priya Rao','prao@example.com','555-3001','VET'),
  ('Dr. Omar Ali','oali@example.com','555-3002','VET');

  -- 2) Shelters (10)
  INSERT INTO Shelter(name,address,phone) VALUES
  ('Downtown Paws','101 Main St, City','555-4001'),
  ('Uptown Tails','202 Elm St, City','555-4002'),
  ('Harbor Haven','303 Bay Rd, City','555-4003'),
  ('Riverside Rescue','404 River Ave, City','555-4004'),
  ('Sunny Park Shelter','505 Park Ln, City','555-4005'),
  ('Brookside Shelter','606 Brook St, City','555-4006'),
  ('Maple Grove','707 Maple Ave, City','555-4007'),
  ('Pine Ridge','808 Pine Rd, City','555-4008'),
  ('Cedar Corner','909 Cedar Blvd, City','555-4009'),
  ('Willow Wings','111 Willow Dr, City','555-4010');

  -- 3) Breed (10)
  INSERT INTO Breed(species,breedName,size,lifespan,temperament) VALUES
  ('Dog','Labrador Retriever','LARGE','10-12 yrs','Friendly, active'),
  ('Dog','Beagle','MEDIUM','12-15 yrs','Curious, merry'),
  ('Dog','Poodle','MEDIUM','12-15 yrs','Smart, active'),
  ('Cat','Domestic Shorthair','MEDIUM','12-16 yrs','Affectionate'),
  ('Cat','Siamese','SMALL','10-12 yrs','Vocal, social'),
  ('Cat','Maine Coon','LARGE','10-13 yrs','Gentle'),
  ('Rabbit','Holland Lop','SMALL','7-10 yrs','Calm'),
  ('Rabbit','Rex','MEDIUM','7-10 yrs','Docile'),
  ('Dog','German Shepherd','LARGE','9-13 yrs','Confident'),
  ('Cat','Bengal','MEDIUM','12-16 yrs','Energetic');

  -- 4) Vaccine (10)
  INSERT INTO Vaccine(name) VALUES
  ('Rabies'),('DHPP'),('Bordetella'),('FVRCP'),('FeLV'),
  ('Leptospirosis'),('Lyme'),('Parvovirus Booster'),('Calicivirus'),('Panleukopenia');

  -- 5) Pets (10)  (mix shelters/breeds/species)
  INSERT INTO Pet(shelterID,name,species,breed,sex,dob,status,intakeDate)
  VALUES
  (1,'Buddy','Dog','Labrador Retriever','M','2021-04-15','AVAILABLE','2025-09-01'),
  (2,'Luna','Cat','Domestic Shorthair','F','2023-02-20','AVAILABLE','2025-09-05'),
  (3,'Max','Dog','Beagle','M','2022-06-10','HOLD','2025-09-10'),
  (4,'Milo','Cat','Siamese','M','2024-01-05','AVAILABLE','2025-09-12'),
  (5,'Bella','Dog','Poodle','F','2020-08-08','AVAILABLE','2025-09-15'),
  (6,'Cleo','Cat','Maine Coon','F','2021-11-11','AVAILABLE','2025-09-18'),
  (7,'Nibbles','Rabbit','Holland Lop','F','2024-04-01','AVAILABLE','2025-09-19'),
  (8,'Scout','Dog','German Shepherd','M','2022-09-09','AVAILABLE','2025-09-20'),
  (9,'Ziggy','Cat','Bengal','M','2023-05-22','AVAILABLE','2025-09-22'),
  (10,'Pumpkin','Rabbit','Rex','F','2024-06-30','AVAILABLE','2025-09-25');

  -- 6) PetVaccine (≥10 entries)
  INSERT INTO PetVaccine(petID,vaccineID,vaccineDate,lotNo) VALUES
  (1,1,'2025-09-02','RAB-001'),
  (1,2,'2025-09-03','DHP-101'),
  (2,4,'2025-09-06','FVR-221'),
  (3,1,'2025-09-11','RAB-002'),
  (4,4,'2025-09-13','FVR-222'),
  (5,2,'2025-09-16','DHP-102'),
  (6,9,'2025-09-19','CAL-009'),
  (7,1,'2025-09-20','RAB-003'),
  (8,7,'2025-09-21','LYM-777'),
  (9,4,'2025-09-23','FVR-223');

  -- 7) Appointments (10)
  INSERT INTO Appointment(petID,adopterID,shelterID,appointmentTime,appointmentType) VALUES
  (1,1,1,'2025-10-01 10:00:00','VISIT'),
  (2,2,2,'2025-10-01 11:00:00','MEET&GREET'),
  (3,3,3,'2025-10-01 12:00:00','VISIT'),
  (4,4,4,'2025-10-02 10:00:00','VISIT'),
  (5,5,5,'2025-10-02 11:00:00','MEET&GREET'),
  (6,1,6,'2025-10-03 09:30:00','VET'),
  (7,2,7,'2025-10-03 10:15:00','VISIT'),
  (8,3,8,'2025-10-03 11:45:00','VISIT'),
  (9,4,9,'2025-10-04 14:00:00','VISIT'),
  (10,5,10,'2025-10-04 15:30:00','MEET&GREET');

  -- 8) Adoptions (10)  (2 finalized, others in pipeline)
  INSERT INTO Adoption(petID,adopterID,status,applicationDate,approvalDate,finalizationDate) VALUES
  (1,1,'APPLIED','2025-10-01',NULL,NULL),
  (2,2,'APPROVED','2025-10-01','2025-10-03',NULL),
  (3,3,'APPLIED','2025-10-01',NULL,NULL),
  (4,4,'FINALIZED','2025-10-02','2025-10-03','2025-10-05'),
  (5,5,'APPLIED','2025-10-02',NULL,NULL),
  (6,1,'APPROVED','2025-10-03','2025-10-05',NULL),
  (7,2,'APPLIED','2025-10-03',NULL,NULL),
  (8,3,'APPLIED','2025-10-03',NULL,NULL),
  (9,4,'REJECTED','2025-10-04',NULL,NULL),
  (10,5,'FINALIZED','2025-10-04','2025-10-05','2025-10-06');

  -- 9) CareLog (10)
  INSERT INTO CareLog(petID,staffID,careDate,careType,notes) VALUES
  (1,6,'2025-09-02 08:00:00','Feeding','Kibble + water'),
  (2,7,'2025-09-06 08:00:00','Cleaning','Litter changed'),
  (3,8,'2025-09-11 08:00:00','Exercise','Short walk'),
  (4,6,'2025-09-13 13:00:00','Grooming','Brushed fur'),
  (5,7,'2025-09-16 09:00:00','Feeding','Wet food'),
  (6,8,'2025-09-19 10:00:00','Medication','Eye drops'),
  (7,6,'2025-09-20 11:00:00','Cleaning','Hutch cleaned'),
  (8,7,'2025-09-21 12:00:00','Exercise','Fetch'),
  (9,8,'2025-09-23 08:30:00','Feeding','Dry food'),
  (10,6,'2025-09-25 09:15:00','Grooming','Nail trim');

  -- 10) Payments (10)  (some tied to adoptions, some appointments)
  INSERT INTO Payment(adopterID,adoptionID,appointmentID,amount,paymentDate,paymentMethod,status) VALUES
  (1,1,NULL,25.00,'2025-10-01 10:05:00','CARD','COMPLETED'),
  (2,2,NULL,25.00,'2025-10-03 09:05:00','CASH','COMPLETED'),
  (3,3,NULL,25.00,'2025-10-01 12:05:00','CARD','COMPLETED'),
  (4,4,NULL,150.00,'2025-10-05 16:00:00','CARD','COMPLETED'),
  (5,5,NULL,25.00,'2025-10-02 11:10:00','CASH','COMPLETED'),
  (1,NULL,6,40.00,'2025-10-03 09:40:00','CARD','COMPLETED'),
  (2,NULL,7,25.00,'2025-10-03 10:20:00','CARD','COMPLETED'),
  (3,NULL,8,25.00,'2025-10-03 11:50:00','CASH','COMPLETED'),
  (4,NULL,9,25.00,'2025-10-04 14:10:00','CARD','COMPLETED'),
  (5,10,NULL,150.00,'2025-10-06 10:00:00','CARD','COMPLETED');
END;

CALL sp_seed_data();

-- ---------------------------------------------------
-- INDEXES
CREATE INDEX IX_Pet_status_species ON Pet (status, species);
CREATE INDEX IX_Pet_shelter ON Pet (shelterID);
CREATE INDEX IX_Adoption_pet ON Adoption (petID, status);
CREATE INDEX IX_Appointment_time ON Appointment (appointmentTime);
CREATE INDEX IX_CareLog_pet ON CareLog (petID, careDate);

-- VIEWS
CREATE OR REPLACE VIEW vw_available_pets AS
SELECT p.petID, p.name, p.species, p.breed, p.sex, p.dob, p.intakeDate, s.name AS shelterName
FROM Pet p JOIN Shelter s ON p.shelterID = s.shelterID
WHERE p.status = 'AVAILABLE';

CREATE OR REPLACE VIEW vw_adoption_pipeline AS
SELECT a.adoptionID, a.petID, p.name AS petName, a.adopterID, u.name AS adopterName, a.status,
       a.applicationDate, a.approvalDate, a.finalizationDate
FROM Adoption a
JOIN Pet p ON p.petID = a.petID
JOIN UserAccount u ON u.userID = a.adopterID;

-- ---------------------------------------------------------

-- Trigger: only ADOPTERs can appear in Adoption.adopterID
CREATE TRIGGER trg_adoption_role_check
BEFORE INSERT ON Adoption
FOR EACH ROW
BEGIN
  DECLARE v_role ENUM('ADOPTER','STAFF','VET','ADMIN');
  SELECT role INTO v_role FROM UserAccount WHERE userID = NEW.adopterID;
  IF v_role IS NULL OR v_role <> 'ADOPTER' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Only users with role=ADOPTER can adopt.';
  END IF;
END;

-- Function: pet age in years
CREATE FUNCTION fn_pet_age_years(p_petID INT)
RETURNS DECIMAL(4,1)
DETERMINISTIC
BEGIN
  DECLARE v_dob DATE;
  DECLARE v_age DECIMAL(4,1);
  SELECT dob INTO v_dob FROM Pet WHERE petID = p_petID;
  IF v_dob IS NULL THEN RETURN NULL; END IF;
  SET v_age = TIMESTAMPDIFF(MONTH, v_dob, CURDATE())/12.0;
  RETURN ROUND(v_age,1);
END;

-- Stored Procedure: safe appointment scheduling
CREATE PROCEDURE sp_schedule_appointment(
  IN p_petID INT, IN p_adopterID INT, IN p_shelterID INT,
  IN p_time DATETIME, IN p_type ENUM('VISIT','MEET&GREET','VET')
)
BEGIN
  -- Basic existence checks
  IF NOT EXISTS (SELECT 1 FROM Pet WHERE petID = p_petID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid petID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM UserAccount WHERE userID = p_adopterID AND role='ADOPTER') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid adopterID or role';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM Shelter WHERE shelterID = p_shelterID) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Invalid shelterID';
  END IF;

  -- Prevent double-booking same pet & exact time
  IF EXISTS (SELECT 1 FROM Appointment
             WHERE petID=p_petID AND appointmentTime = p_time) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Pet already has an appointment at that time';
  END IF;

  INSERT INTO Appointment(petID, adopterID, shelterID, appointmentTime, appointmentType)
  VALUES (p_petID, p_adopterID, p_shelterID, p_time, p_type);
END;

-- -----------------------------------------------------------
-- SQL COMMANDS FOR WEB APP

-- browse pet
SELECT p.*, s.name AS shelterName
FROM Pet p JOIN Shelter s ON s.shelterID=p.shelterID
WHERE (p.status = 'AVAILABLE')
  AND (COALESCE(?species, p.species) = p.species)
  AND (COALESCE(?breed, p.breed) = p.breed)
  AND (COALESCE(?sex, p.sex) = p.sex)
ORDER BY p.intakeDate DESC
LIMIT ?limit OFFSET ?offset;


-- Pet Details (with Age)
SELECT p.*, fn_pet_age_years(p.petID) AS ageYears, s.name AS shelterName
FROM Pet p JOIN Shelter s ON s.shelterID=p.shelterID
WHERE p.petID = ?petID;

-- Adopter Dashboard (Applications)
SELECT * FROM vw_adoption_pipeline 
WHERE adopterID = ?userID 
ORDER BY applicationDate DESC;

-- Vaccination History
SELECT v.name, pv.vaccineDate, pv.lotNo
FROM PetVaccine pv JOIN Vaccine v ON v.vaccineID=pv.vaccineID
WHERE pv.petID=?petID 
ORDER BY pv.vaccineDate DESC;

-- Create Adoption Application
INSERT INTO Adoption(petID, adopterID, status, applicationDate)
VALUES (?petID, ?adopterID, 'APPLIED', NOW());

-- Schedule Appointment (uses procedure validation)
CALL sp_schedule_appointment(?petID, ?adopterID, ?shelterID, ?time, ?type);

-- Staff Care Log Entry
INSERT INTO CareLog(petID, staffID, careDate, careType, notes)
VALUES (?petID, ?staffID, NOW(), ?careType, ?notes);

-- Record Payment
INSERT INTO Payment(adopterID, adoptionID, appointmentID, amount, paymentDate, paymentMethod, status)
VALUES (?adopterID, ?adoptionID, ?appointmentID, ?amount, NOW(), ?method, 'COMPLETED');

-- Approve Adoption
UPDATE Adoption
SET status='APPROVED', approvalDate=NOW()
WHERE adoptionID=?adoptionID AND status='APPLIED';

-- Finalize Adoption
UPDATE Adoption
SET status='FINALIZED', finalizationDate=NOW()
WHERE adoptionID=?adoptionID AND status='APPROVED';

-- DELETE DATA
DELETE FROM Pet WHERE petID = ?petID;
DELETE FROM Adoption WHERE adoptionID = ?adoptionID;

-- -----------------------------------------------------------
-- TESTING 
-- -------------------------------------------
-- Counts (expect >= 10 each)
SELECT 'UserAccount' tbl, COUNT(*) FROM UserAccount
UNION ALL SELECT 'Shelter', COUNT(*) FROM Shelter
UNION ALL SELECT 'Breed', COUNT(*) FROM Breed
UNION ALL SELECT 'Vaccine', COUNT(*) FROM Vaccine
UNION ALL SELECT 'Pet', COUNT(*) FROM Pet
UNION ALL SELECT 'PetVaccine', COUNT(*) FROM PetVaccine
UNION ALL SELECT 'Appointment', COUNT(*) FROM Appointment
UNION ALL SELECT 'Adoption', COUNT(*) FROM Adoption
UNION ALL SELECT 'CareLog', COUNT(*) FROM CareLog
UNION ALL SELECT 'Payment', COUNT(*) FROM Payment;

-- View sample
SELECT * FROM vw_available_pets;

-- Trigger test (needs to fail): try to insert STAFF as adopter
-- INSERT INTO Adoption(petID, adopterID, status) VALUES (1, 6, 'APPLIED');  -- should give us an error

-- Function test
SELECT petID, name, fn_pet_age_years(petID) AS ageYears FROM Pet;

-- Procedure test (succeeds)
CALL sp_schedule_appointment(1,1,1,'2025-10-10 09:00:00','VISIT');

-- Procedure test (needs to fail: check for double-bookings)
-- CALL sp_schedule_appointment(1,1,1,'2025-10-10 09:00:00','VISIT'); -- expect an error

