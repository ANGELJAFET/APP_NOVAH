-- =====================================================================
-- Script de base de datos MySQL - Prueba Práctica Fullstack
-- Entidades: PERSON (maestro) / EDUCATIONAL_CREDENTIALS (detalle)
-- Incluye tablas, procedimientos almacenados (SP) y usuario demo (login)
-- =====================================================================

DROP DATABASE IF EXISTS prueba_practica_pilv;
CREATE DATABASE prueba_practica_pilv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prueba_practica_pilv;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

CREATE TABLE person (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nit VARCHAR(10) NOT NULL,
  name VARCHAR(60) NOT NULL,
  address VARCHAR(100) NOT NULL,
  phone_number VARCHAR(16) NOT NULL,
  CONSTRAINT uk_person_nit UNIQUE (nit)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE educational_credentials (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT NOT NULL,
  type VARCHAR(10) NOT NULL,
  organization VARCHAR(60) NOT NULL,
  acquired_credential VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  CONSTRAINT fk_credentials_person FOREIGN KEY (person_id)
    REFERENCES person (id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla mínima de usuarios para el login / autenticación JWT del API
CREATE TABLE app_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  CONSTRAINT uk_app_user_username UNIQUE (username)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usuario demo: username = admin / password = Admin123!
INSERT INTO app_user (username, password_hash) VALUES
  ('admin', '$2b$10$OOI7ZIJoqxAJkb9SKc.N9.vBtZdBkPsDKE1d.szOh/ePefGxxuXS2');

-- ---------------------------------------------------------------------
-- Stored Procedures
-- ---------------------------------------------------------------------

DELIMITER $$

-- Login: obtener usuario por username
CREATE PROCEDURE sp_user_get_by_username(
  IN p_username VARCHAR(50)
)
BEGIN
  SELECT id, username, password_hash
  FROM app_user
  WHERE username = p_username;
END$$

-- Listado paginado de personas, con filtro por nombre y orden por id/name
CREATE PROCEDURE sp_person_list(
  IN p_name VARCHAR(60),
  IN p_page INT,
  IN p_page_size INT,
  IN p_sort_by VARCHAR(10),
  IN p_sort_dir VARCHAR(4),
  OUT p_total INT
)
BEGIN
  DECLARE v_offset INT;
  DECLARE v_sort_col VARCHAR(10);
  DECLARE v_sort_dir VARCHAR(4);
  DECLARE v_name_filter VARCHAR(62);

  IF p_page IS NULL OR p_page < 1 THEN
    SET p_page = 1;
  END IF;
  IF p_page_size IS NULL OR p_page_size < 1 THEN
    SET p_page_size = 5;
  END IF;
  SET v_offset = (p_page - 1) * p_page_size;

  IF p_sort_by = 'name' THEN
    SET v_sort_col = 'name';
  ELSE
    SET v_sort_col = 'id';
  END IF;

  IF UPPER(IFNULL(p_sort_dir, '')) = 'DESC' THEN
    SET v_sort_dir = 'DESC';
  ELSE
    SET v_sort_dir = 'ASC';
  END IF;

  SET v_name_filter = CONCAT('%', IFNULL(p_name, ''), '%');

  SELECT COUNT(*) INTO p_total
  FROM person
  WHERE (p_name IS NULL OR p_name = '' OR name LIKE v_name_filter);

  SET @qry = CONCAT(
    'SELECT id, nit, name, address, phone_number FROM person ',
    'WHERE (? IS NULL OR ? = \'\' OR name LIKE ?) ',
    'ORDER BY ', v_sort_col, ' ', v_sort_dir, ' ',
    'LIMIT ? OFFSET ?'
  );
  SET @p_name = p_name;
  SET @p_name_filter = v_name_filter;
  SET @p_page_size = p_page_size;
  SET @v_offset = v_offset;

  PREPARE stmt FROM @qry;
  EXECUTE stmt USING @p_name, @p_name, @p_name_filter, @p_page_size, @v_offset;
  DEALLOCATE PREPARE stmt;
END$$

-- Obtener una persona por id junto con sus credenciales educativas
CREATE PROCEDURE sp_person_get_by_id(
  IN p_id BIGINT
)
BEGIN
  SELECT id, nit, name, address, phone_number
  FROM person
  WHERE id = p_id;

  SELECT id, person_id, type, organization, acquired_credential, year
  FROM educational_credentials
  WHERE person_id = p_id
  ORDER BY id;
END$$

-- Insertar una persona nueva, validando unicidad del NIT
CREATE PROCEDURE sp_person_insert(
  IN p_nit VARCHAR(10),
  IN p_name VARCHAR(60),
  IN p_address VARCHAR(100),
  IN p_phone_number VARCHAR(16)
)
BEGIN
  DECLARE v_exists INT;

  SELECT COUNT(*) INTO v_exists FROM person WHERE nit = p_nit;
  IF v_exists > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NIT_ALREADY_EXISTS';
  END IF;

  INSERT INTO person (nit, name, address, phone_number)
  VALUES (p_nit, p_name, p_address, p_phone_number);

  SELECT id, nit, name, address, phone_number
  FROM person
  WHERE id = LAST_INSERT_ID();
END$$

-- Actualizar una persona existente (nit e id son inmutables)
CREATE PROCEDURE sp_person_update(
  IN p_id BIGINT,
  IN p_name VARCHAR(60),
  IN p_address VARCHAR(100),
  IN p_phone_number VARCHAR(16)
)
BEGIN
  DECLARE v_exists INT;

  SELECT COUNT(*) INTO v_exists FROM person WHERE id = p_id;
  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PERSON_NOT_FOUND';
  END IF;

  UPDATE person
  SET name = p_name, address = p_address, phone_number = p_phone_number
  WHERE id = p_id;

  SELECT id, nit, name, address, phone_number
  FROM person
  WHERE id = p_id;
END$$

-- Eliminar una persona (elimina en cascada sus credenciales)
CREATE PROCEDURE sp_person_delete(
  IN p_id BIGINT
)
BEGIN
  DECLARE v_exists INT;

  SELECT COUNT(*) INTO v_exists FROM person WHERE id = p_id;
  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PERSON_NOT_FOUND';
  END IF;

  DELETE FROM person WHERE id = p_id;
END$$

-- Insertar una credencial educativa para una persona
CREATE PROCEDURE sp_credential_insert(
  IN p_person_id BIGINT,
  IN p_type VARCHAR(10),
  IN p_organization VARCHAR(60),
  IN p_acquired_credential VARCHAR(100),
  IN p_year INT
)
BEGIN
  IF p_type NOT IN ('GED', 'BACHELORS', 'MASTERS', 'PHD', 'CERTIFICATION') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_CREDENTIAL_TYPE';
  END IF;

  INSERT INTO educational_credentials (person_id, type, organization, acquired_credential, year)
  VALUES (p_person_id, p_type, p_organization, p_acquired_credential, p_year);

  SELECT id, person_id, type, organization, acquired_credential, year
  FROM educational_credentials
  WHERE id = LAST_INSERT_ID();
END$$

-- Eliminar todas las credenciales de una persona (usado al editar: se
-- reemplaza el detalle completo por el set actual en memoria del formulario)
CREATE PROCEDURE sp_credentials_delete_by_person(
  IN p_person_id BIGINT
)
BEGIN
  DELETE FROM educational_credentials WHERE person_id = p_person_id;
END$$

DELIMITER ;
