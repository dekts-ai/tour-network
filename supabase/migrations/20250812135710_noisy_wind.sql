-- MySQL Database Structure for Add-ons Storage
-- This structure supports all add-on field types and pricing models

-- 1. Main Add-ons Form Table
CREATE TABLE `addon_forms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_id` int(11) NOT NULL,
  `tenant_id` varchar(50) NOT NULL,
  `form_name` varchar(255) DEFAULT 'Package Add-ons',
  `form_description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_package_tenant` (`package_id`, `tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add-on Fields Definition Table
CREATE TABLE `addon_fields` (
  `id` varchar(50) NOT NULL, -- Unique field identifier
  `form_id` int(11) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_type` enum('checkbox','radio','select','number','text','textarea') NOT NULL,
  `field_order` int(11) DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 0,
  `visibility` enum('frontend','backend','both') DEFAULT 'frontend',
  `default_value` text,
  `description` text,
  `validation_rules` json, -- Store min, max, etc.
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_field_order` (`field_order`),
  FOREIGN KEY (`form_id`) REFERENCES `addon_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add-on Field Options Table (for radio, select, checkbox with multiple options)
CREATE TABLE `addon_field_options` (
  `id` varchar(50) NOT NULL,
  `field_id` varchar(50) NOT NULL,
  `option_name` varchar(255) NOT NULL,
  `option_value` varchar(255) NOT NULL,
  `option_order` int(11) DEFAULT 0,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_field_id` (`field_id`),
  KEY `idx_option_order` (`option_order`),
  FOREIGN KEY (`field_id`) REFERENCES `addon_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Add-on Pricing Information Table
CREATE TABLE `addon_pricing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field_id` varchar(50) NOT NULL,
  `pricing_enabled` tinyint(1) DEFAULT 0,
  `price_type` varchar(10) DEFAULT 'USD',
  `unit_type` enum('setprice','priceperpax','n') DEFAULT 'n',
  `base_price` decimal(10,2) DEFAULT 0.00,
  `inventory_status` varchar(50) DEFAULT '',
  `service_fee` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_field_pricing` (`field_id`),
  FOREIGN KEY (`field_id`) REFERENCES `addon_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Booking Add-ons Selections Table (stores customer selections)
CREATE TABLE `booking_addons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` varchar(100) NOT NULL,
  `cart_item_id` varchar(100) NOT NULL,
  `field_id` varchar(50) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_type` varchar(50) NOT NULL,
  `selected_value` text, -- JSON or text based on field type
  `pricing_details` json, -- Store calculated pricing breakdown
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_cart_item` (`cart_item_id`),
  KEY `idx_field_id` (`field_id`),
  FOREIGN KEY (`field_id`) REFERENCES `addon_fields` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Add-on Field Details Storage (for complex field configurations)
CREATE TABLE `addon_field_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field_id` varchar(50) NOT NULL,
  `detail_key` varchar(100) NOT NULL, -- e.g., 'attrs', 'validation', 'display_config'
  `detail_value` json NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_field_detail` (`field_id`, `detail_key`),
  FOREIGN KEY (`field_id`) REFERENCES `addon_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Data Insertion Examples:

-- Insert a form for a package
INSERT INTO `addon_forms` (`package_id`, `tenant_id`, `form_name`) 
VALUES (123, 'operator1', 'Canyon Tour Add-ons');

-- Insert checkbox field
INSERT INTO `addon_fields` (`id`, `form_id`, `field_name`, `field_type`, `field_order`, `is_required`, `description`) 
VALUES ('photo_package', 1, 'Professional Photo Package', 'checkbox', 1, 0, 'Get professional photos of your tour');

-- Insert pricing for checkbox
INSERT INTO `addon_pricing` (`field_id`, `pricing_enabled`, `unit_type`, `base_price`, `service_fee`) 
VALUES ('photo_package', 1, 'setprice', 25.00, 2.50);

-- Insert radio field with options
INSERT INTO `addon_fields` (`id`, `form_id`, `field_name`, `field_type`, `field_order`, `is_required`) 
VALUES ('meal_option', 1, 'Meal Preference', 'radio', 2, 1);

-- Insert radio options
INSERT INTO `addon_field_options` (`id`, `field_id`, `option_name`, `option_value`, `option_order`) VALUES
('meal_none', 'meal_option', 'No Meal', '0', 1),
('meal_lunch', 'meal_option', 'Lunch Package', 'lunch', 2),
('meal_dinner', 'meal_option', 'Dinner Package', 'dinner', 3);

-- Insert pricing for radio field
INSERT INTO `addon_pricing` (`field_id`, `pricing_enabled`, `unit_type`, `base_price`) 
VALUES ('meal_option', 1, 'priceperpax', 15.00);

-- Insert number field
INSERT INTO `addon_fields` (`id`, `form_id`, `field_name`, `field_type`, `field_order`, `description`) 
VALUES ('extra_water', 1, 'Extra Water Bottles', 'number', 3, 'Additional water bottles for the tour');

-- Insert field details for number field (min/max values)
INSERT INTO `addon_field_details` (`field_id`, `detail_key`, `detail_value`) 
VALUES ('extra_water', 'attrs', '{"min": "0", "max": "10"}');

-- Insert pricing for number field
INSERT INTO `addon_pricing` (`field_id`, `pricing_enabled`, `unit_type`, `base_price`) 
VALUES ('extra_water', 1, 'setprice', 3.00);

-- Sample booking add-on selection storage
INSERT INTO `booking_addons` (`booking_id`, `cart_item_id`, `field_id`, `field_name`, `field_type`, `selected_value`, `pricing_details`) 
VALUES (
  'TN-1234567890', 
  'cart_item_1', 
  'photo_package', 
  'Professional Photo Package', 
  'checkbox', 
  'true',
  '{"subtotal": 25.00, "commission": 2.50, "total": 27.50, "enabled": true, "unit": "setprice"}'
);

-- Indexes for better performance
CREATE INDEX `idx_addon_forms_package` ON `addon_forms` (`package_id`);
CREATE INDEX `idx_addon_fields_form_order` ON `addon_fields` (`form_id`, `field_order`);
CREATE INDEX `idx_booking_addons_booking` ON `booking_addons` (`booking_id`);
CREATE INDEX `idx_addon_pricing_enabled` ON `addon_pricing` (`pricing_enabled`);

-- Views for easier data retrieval

-- View to get complete field information with pricing
CREATE VIEW `addon_fields_complete` AS
SELECT 
    af.id,
    af.form_id,
    af.field_name,
    af.field_type,
    af.field_order,
    af.is_required,
    af.visibility,
    af.default_value,
    af.description,
    af.validation_rules,
    ap.pricing_enabled,
    ap.price_type,
    ap.unit_type,
    ap.base_price,
    ap.service_fee,
    aform.package_id,
    aform.tenant_id
FROM addon_fields af
LEFT JOIN addon_pricing ap ON af.id = ap.field_id
LEFT JOIN addon_forms aform ON af.form_id = aform.id
WHERE aform.status = 'active'
ORDER BY af.field_order;

-- View to get field options
CREATE VIEW `addon_field_options_view` AS
SELECT 
    afo.id,
    afo.field_id,
    afo.option_name,
    afo.option_value,
    afo.option_order,
    afo.is_default,
    af.field_name,
    af.field_type
FROM addon_field_options afo
JOIN addon_fields af ON afo.field_id = af.id
ORDER BY afo.field_id, afo.option_order;

-- View for booking add-ons summary
CREATE VIEW `booking_addons_summary` AS
SELECT 
    ba.booking_id,
    ba.cart_item_id,
    COUNT(*) as total_addons,
    SUM(JSON_EXTRACT(ba.pricing_details, '$.subtotal')) as total_addon_subtotal,
    SUM(JSON_EXTRACT(ba.pricing_details, '$.commission')) as total_addon_commission,
    SUM(JSON_EXTRACT(ba.pricing_details, '$.total')) as total_addon_amount
FROM booking_addons ba
WHERE JSON_EXTRACT(ba.pricing_details, '$.enabled') = true
GROUP BY ba.booking_id, ba.cart_item_id;