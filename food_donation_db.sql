-- ============================================================
-- FOODCONNECT - FOOD DONATION & NGO CONNECT APP
-- FINAL DATABASE SCRIPT
-- MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS food_donation_db;

USE food_donation_db;

-- ============================================================
-- REMOVE OLD VIEWS
-- ============================================================

DROP VIEW IF EXISTS donation_inspection_view;
DROP VIEW IF EXISTS available_donations_view;

-- ============================================================
-- REMOVE OLD TABLES
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS distributions;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS food_inspections;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    phone VARCHAR(20),

    password VARCHAR(255) NOT NULL,

    role ENUM('DONOR', 'NGO', 'ADMIN')
        NOT NULL DEFAULT 'DONOR',

    organization_name VARCHAR(150),

    address VARCHAR(255),

    city VARCHAR(100),

    state VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
);

-- ============================================================
-- DONATIONS
-- ============================================================

CREATE TABLE donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,

    donor_id INT NOT NULL,

    food_name VARCHAR(150) NOT NULL,

    food_type VARCHAR(100) NOT NULL,

    description TEXT,

    quantity DECIMAL(10,2) NOT NULL,

    unit VARCHAR(50) NOT NULL,

    location VARCHAR(255) NOT NULL,

    available_from DATETIME NOT NULL,

    available_until DATETIME NOT NULL,

    prepared_at DATETIME,

    storage_method VARCHAR(100),

    -- Large Base64 food image
    food_photo MEDIUMTEXT NULL,

    status ENUM(
        'AVAILABLE',
        'REQUESTED',
        'APPROVED',
        'ARRIVING',
        'COLLECTED',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'AVAILABLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_donation_donor
        FOREIGN KEY (donor_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_donation_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_donation_dates
        CHECK (available_until >= available_from),

    INDEX idx_donations_donor (donor_id),
    INDEX idx_donations_status (status),
    INDEX idx_donations_available_until (available_until),
    INDEX idx_donations_food_type (food_type),
    INDEX idx_donations_location (location)
);

-- ============================================================
-- FOOD INSPECTIONS
-- ============================================================

CREATE TABLE food_inspections (
    inspection_id INT AUTO_INCREMENT PRIMARY KEY,

    donation_id INT NOT NULL UNIQUE,

    ngo_id INT NOT NULL,

    condition_status ENUM(
        'FRESH',
        'SPOILED'
    ) NOT NULL,

    inspection_notes TEXT,

    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inspection_donation
        FOREIGN KEY (donation_id)
        REFERENCES donations(donation_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_inspection_ngo
        FOREIGN KEY (ngo_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_inspection_ngo (ngo_id),
    INDEX idx_inspection_condition (condition_status)
);

-- ============================================================
-- REQUESTS
-- ============================================================

CREATE TABLE requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,

    donation_id INT NOT NULL,

    ngo_id INT NOT NULL,

    requested_quantity DECIMAL(10,2) NOT NULL,

    message TEXT,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'ARRIVING',
        'COLLECTED',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_request_donation
        FOREIGN KEY (donation_id)
        REFERENCES donations(donation_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_request_ngo
        FOREIGN KEY (ngo_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_requested_quantity
        CHECK (requested_quantity > 0),

    INDEX idx_requests_donation (donation_id),
    INDEX idx_requests_ngo (ngo_id),
    INDEX idx_requests_status (status)
);

-- ============================================================
-- COLLECTIONS
-- ============================================================

CREATE TABLE collections (
    collection_id INT AUTO_INCREMENT PRIMARY KEY,

    request_id INT NOT NULL UNIQUE,

    ngo_id INT NOT NULL,

    collection_date DATETIME NOT NULL,

    collector_name VARCHAR(150) NOT NULL,

    arrival_message TEXT,

    status ENUM(
        'SCHEDULED',
        'ARRIVING',
        'COLLECTED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'SCHEDULED',

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_collection_request
        FOREIGN KEY (request_id)
        REFERENCES requests(request_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_collection_ngo
        FOREIGN KEY (ngo_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_collections_ngo (ngo_id),
    INDEX idx_collections_status (status),
    INDEX idx_collections_date (collection_date)
);

-- ============================================================
-- DISTRIBUTIONS
-- ============================================================

CREATE TABLE distributions (
    distribution_id INT AUTO_INCREMENT PRIMARY KEY,

    collection_id INT NOT NULL,

    ngo_id INT NOT NULL,

    distributed_quantity DECIMAL(10,2) NOT NULL,

    distribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    beneficiary_count INT NOT NULL,

    location VARCHAR(255) NOT NULL,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_distribution_collection
        FOREIGN KEY (collection_id)
        REFERENCES collections(collection_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_distribution_ngo
        FOREIGN KEY (ngo_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_distributed_quantity
        CHECK (distributed_quantity > 0),

    CONSTRAINT chk_beneficiary_count
        CHECK (beneficiary_count > 0),

    INDEX idx_distributions_collection (collection_id),
    INDEX idx_distributions_ngo (ngo_id),
    INDEX idx_distributions_date (distribution_date)
);

-- ============================================================
-- FEEDBACK
-- ============================================================

CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    donation_id INT NULL,

    rating INT NOT NULL,

    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_feedback_donation
        FOREIGN KEY (donation_id)
        REFERENCES donations(donation_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5),

    INDEX idx_feedback_user (user_id),
    INDEX idx_feedback_donation (donation_id),
    INDEX idx_feedback_rating (rating)
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

CREATE TABLE logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id INT,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_logs_user (user_id),
    INDEX idx_logs_action (action),
    INDEX idx_logs_entity (entity_type, entity_id),
    INDEX idx_logs_created (created_at)
);

-- ============================================================
-- AVAILABLE DONATIONS VIEW
-- ============================================================

CREATE VIEW available_donations_view AS
SELECT
    d.donation_id,
    d.donor_id,
    u.full_name AS donor_name,
    d.food_name,
    d.food_type,
    d.description,
    d.quantity,
    d.unit,
    d.location,
    d.available_from,
    d.available_until,
    d.prepared_at,
    d.storage_method,
    d.food_photo,
    d.status,
    d.created_at
FROM donations d
JOIN users u
    ON d.donor_id = u.user_id
WHERE d.status = 'AVAILABLE'
  AND d.available_until >= NOW();

-- ============================================================
-- DONATION INSPECTION VIEW
-- ============================================================

CREATE VIEW donation_inspection_view AS
SELECT
    d.donation_id,

    d.food_name,

    d.food_type,

    d.quantity,

    d.unit,

    d.location,

    d.status AS donation_status,

    d.available_from,

    d.available_until,

    d.created_at AS donation_created_at,

    u.full_name AS donor_name,

    u.email AS donor_email,

    fi.inspection_id,

    fi.ngo_id,

    ngo.full_name AS ngo_name,

    fi.condition_status,

    fi.inspection_notes,

    fi.inspected_at

FROM donations d

JOIN users u
    ON d.donor_id = u.user_id

LEFT JOIN food_inspections fi
    ON d.donation_id = fi.donation_id

LEFT JOIN users ngo
    ON fi.ngo_id = ngo.user_id;

-- ============================================================
-- VERIFY DATABASE
-- ============================================================

SELECT DATABASE() AS current_database;

SHOW TABLES;

-- ============================================================
-- VERIFY COLUMN TYPES
-- ============================================================

SHOW COLUMNS
FROM donations
LIKE 'food_photo';

-- ============================================================
-- VERIFY TABLES
-- ============================================================

DESCRIBE users;

DESCRIBE donations;

DESCRIBE food_inspections;

DESCRIBE requests;

DESCRIBE collections;

DESCRIBE distributions;

DESCRIBE feedback;

DESCRIBE logs;

-- ============================================================
-- VERIFY VIEWS
-- ============================================================

SHOW FULL TABLES
WHERE TABLE_TYPE = 'VIEW';

-- ============================================================
-- VERIFY RECORD COUNTS
-- ============================================================

SELECT COUNT(*) AS total_users
FROM users;

SELECT COUNT(*) AS total_donations
FROM donations;

SELECT COUNT(*) AS total_requests
FROM requests;

SELECT COUNT(*) AS total_inspections
FROM food_inspections;

SELECT COUNT(*) AS total_collections
FROM collections;

SELECT COUNT(*) AS total_distributions
FROM distributions;

SELECT COUNT(*) AS total_feedback
FROM feedback;

SELECT COUNT(*) AS total_logs
FROM logs;

-- ============================================================
-- FINAL MESSAGE
-- ============================================================

SELECT
    'FOODCONNECT DATABASE CREATED SUCCESSFULLY' AS message;