CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  category ENUM('city', 'suv', 'luxury', 'utility') NOT NULL,
  price_per_day_cents INT UNSIGNED NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_vehicles_availability_price (is_available, price_per_day_cents)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  client_name VARCHAR(120) NOT NULL,
  client_email VARCHAR(190) NOT NULL,
  client_phone VARCHAR(30) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount_cents INT UNSIGNED NOT NULL,
  deposit_amount_cents INT UNSIGNED NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'canceled') NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  stripe_event_last_id VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_reservations_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  UNIQUE KEY uq_reservations_payment_intent (stripe_payment_intent_id),
  INDEX idx_reservations_vehicle_dates (vehicle_id, start_date, end_date),
  INDEX idx_reservations_payment_status (payment_status),
  CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
