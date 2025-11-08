CREATE DATABASE bazarigo_db;
-- Tables for Bazarigo E-commerce Platform


-- Products Table


CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    regular_price INT DEFAULT 0,
    sale_price INT NOT NULL,
    discount INT DEFAULT 0,
    rating NUMERIC(3,2),
    isBestSeller BOOLEAN DEFAULT FALSE,
    isHot BOOLEAN DEFAULT FALSE,
    isNew BOOLEAN DEFAULT TRUE,
    isTrending BOOLEAN DEFAULT FALSE,
    isLimitedStock BOOLEAN DEFAULT FALSE,
    isExclusive BOOLEAN DEFAULT FALSE,
    isFlashSale BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    stock INT DEFAULT 0,
    brand VARCHAR(100),
    weight DECIMAL(10,2) DEFAULT 1,
    images TEXT[],
    extras JSONB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT NULL,
    seller_id VARCHAR(100),
    seller_name VARCHAR(150),
    seller_store_name VARCHAR(150)
);



-- Flash Sale Products Table
CREATE TABLE flashSaleProducts(
    isActive BOOLEAN DEFAULT FALSE,
    duration INT,
    saleProducts JSONB
);

-- Sellers Table
CREATE TABLE sellers (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    img TEXT,
    nid_number VARCHAR(50),
    store_name VARCHAR(255),
    product_category VARCHAR(255),
    business_address TEXT,
    district VARCHAR(100) NOT NULL,thana VARCHAR(100) NOT NULL,
    postal_code INT  NOT NULL,
    trade_license_number VARCHAR(50),
    nid_front_file TEXT,        
    nid_back_file TEXT,         
    bank_name VARCHAR(100),
    branch_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder_name VARCHAR(50),
    routing_number VARCHAR(50),
    mobile_bank_name VARCHAR(100),
    mobile_bank_account_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'pending'
);

-- Users Table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  img  TEXT DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT DEFAULT NULL,
  district VARCHAR(100) NULL,
  thana VARCHAR(100) NULL,
  postal_code INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NULL
); 



-- Zone Table
-- CREATE TABLE zones (
--   id VARCHAR(255) PRIMARY KEY,
--   zone_name VARCHAR(100),
--   district VARCHAR(100),
--   postcode_start INT,
--   postcode_end INT,
--   delivery_charge DECIMAL(10,2)
-- );



CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  delivery_time VARCHAR(50),
  delivery_charge INTEGER NOT NULL,
  per_kg_charge INTEGER DEFAULT 10,
  free_delivery_min_amount INTEGER DEFAULT 2500 
);


-- Postal Zones Table
CREATE TABLE postal_zones (
  id SERIAL PRIMARY KEY,
  postal_code INT  NOT NULL,
  division VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  thana VARCHAR(100) NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  is_remote BOOLEAN DEFAULT FALSE
);

-- Orders Table

CREATE TABLE orders (
    order_id VARCHAR(255) PRIMARY KEY,
    order_number SERIAL NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(100),
    order_status VARCHAR(50) DEFAULT 'pending',
    estimated_delivery_date VARCHAR(50) DEFAULT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    order_items JSONB NOT NULL,
    subtotal INT NOT NULL,
    delivery_cost INT DEFAULT 0,
    total INT NOT NULL
);

-- Return Orders Table
CREATE TABLE return_orders (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255)  NOT NULL,
  reason TEXT  NOT NULL,
  img  TEXT DEFAULT NULL
);





-- Payments Table
CREATE TABLE payments (
      id VARCHAR(255) PRIMARY KEY,
      transaction_id VARCHAR(255) NOT NULL,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      amount INT NOT NULL,
      payment_method VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      phone_number VARCHAR(50) DEFAULT NULL
);

-- Notification Table
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carts Table 


CREATE TABLE carts (
  cart_id VARCHAR(255) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  sellerId VARCHAR(255) NOT NULL,
  product_info JSONB,
  deliveries JSONB
);




-- Wishlist Table 
CREATE TABLE wishlist (
  user_email VARCHAR(255) NOT NULL,
  wishlist_id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  product_name TEXT NOT NULL,
  price INT NOT NULL,
  img TEXT
);

-- Promotions Table
CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  discount INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE
);



-- POST PRODUCT on products table  EXAMPLE
INSERT INTO products (id, name,price,description)
VALUES ('prod-001', 'Sample Product', 100, 'This is a sample product description.');

-- READ all products from products table
SELECT * FROM products;

-- READ single product by id from products table
SELECT * FROM products WHERE id = 'prod-001';

-- READ products specific fields from products table
SELECT id, name, price FROM products;

-- READ products with category filter from products table
SELECT * FROM products WHERE category = 'Electronics';

-- DELETE single product by id from products table
DELETE FROM products WHERE id = 'prod-001';

-- DELETE all products from products table
DELETE FROM products;

-- UPDATE single product by id from products table EXAMPLE
UPDATE products
SET price = 120, description = 'Updated product description.'
WHERE id = 'prod-001';