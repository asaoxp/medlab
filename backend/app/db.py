import mysql.connector
from mysql.connector import Error
from . import config
from app.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# ---------- Low-level connection helpers ----------

def get_server_connection():
    """
    Connect to MySQL server WITHOUT specifying database.
    Used for CREATE DATABASE if not exists.
    """
    return mysql.connector.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
    )


def get_db_connection():
    """
    Connect to the specific project database.
    Assumes database already exists (init_db() should ensure that).
    """
    return mysql.connector.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        database=config.DB_NAME,
    )

# ---------- DB initialization (create DB + tables) ----------

def create_database_if_not_exists():
    try:
        conn = get_server_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{config.DB_NAME}`")
        cursor.close()
        conn.close()
        print(f"[DB] Database `{config.DB_NAME}` is ready.")
    except Error as e:
        print(f"[DB ERROR] Failed to create database: {e}")
        raise


def create_tables_if_not_exist():
    """
    Create all required tables with IF NOT EXISTS.
    Order matters for foreign keys.
    """
    ddl_statements = [

        # patients
        """
        CREATE TABLE IF NOT EXISTS patients (
            patient_id      INT AUTO_INCREMENT PRIMARY KEY,
            full_name       VARCHAR(100) NOT NULL,
            date_of_birth   DATE NULL,
            gender          ENUM('M', 'F', 'O') NULL,
            phone           VARCHAR(20),
            email           VARCHAR(100),
            address         VARCHAR(255),
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        """,

        # doctors
        """
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id       INT AUTO_INCREMENT PRIMARY KEY,
            full_name       VARCHAR(100) NOT NULL,
            specialization  VARCHAR(100),
            phone           VARCHAR(20),
            email           VARCHAR(100),
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        """,

        # test_categories
        """
        CREATE TABLE IF NOT EXISTS test_categories (
            category_id     INT AUTO_INCREMENT PRIMARY KEY,
            category_name   VARCHAR(100) NOT NULL,
            description     VARCHAR(255)
        ) ENGINE=InnoDB;
        """,

        # tests
        """
        CREATE TABLE IF NOT EXISTS tests (
            test_id         INT AUTO_INCREMENT PRIMARY KEY,
            test_name       VARCHAR(150) NOT NULL,
            category_id     INT,
            sample_type     VARCHAR(100),
            unit            VARCHAR(50),
            normal_min      DECIMAL(10,2) NULL,
            normal_max      DECIMAL(10,2) NULL,
            price           DECIMAL(10,2) DEFAULT 0,
            is_active       TINYINT(1) DEFAULT 1,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_tests_category
                FOREIGN KEY (category_id)
                REFERENCES test_categories(category_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """,

        # test_orders
        """
        CREATE TABLE IF NOT EXISTS test_orders (
            order_id            INT AUTO_INCREMENT PRIMARY KEY,
            patient_id          INT NOT NULL,
            doctor_id           INT NULL,
            order_date          DATETIME DEFAULT CURRENT_TIMESTAMP,
            priority            ENUM('NORMAL', 'URGENT') DEFAULT 'NORMAL',
            status              ENUM('PENDING', 'SAMPLE_COLLECTED', 'RESULTS_ENTERED', 'REPORT_READY')
                                    DEFAULT 'PENDING',
            total_amount        DECIMAL(10,2) DEFAULT 0,
            notes               TEXT,
            sample_collected_at DATETIME NULL,
            sample_collected_by VARCHAR(100),
            results_entered_at  DATETIME NULL,
            report_ready_at     DATETIME NULL,
            CONSTRAINT fk_orders_patient
                FOREIGN KEY (patient_id)
                REFERENCES patients(patient_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT,
            CONSTRAINT fk_orders_doctor
                FOREIGN KEY (doctor_id)
                REFERENCES doctors(doctor_id)
                ON UPDATE CASCADE
                ON DELETE SET NULL
        ) ENGINE=InnoDB;
        """,

        # test_order_tests
        """
        CREATE TABLE IF NOT EXISTS test_order_tests (
            order_test_id       INT AUTO_INCREMENT PRIMARY KEY,
            order_id            INT NOT NULL,
            test_id             INT NOT NULL,
            result_value        VARCHAR(50) NULL,
            result_flag         ENUM('LOW', 'NORMAL', 'HIGH') NULL,
            unit                VARCHAR(50),
            normal_range_text   VARCHAR(100),
            result_entered_at   DATETIME NULL,
            CONSTRAINT fk_order_tests_order
                FOREIGN KEY (order_id)
                REFERENCES test_orders(order_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
            CONSTRAINT fk_order_tests_test
                FOREIGN KEY (test_id)
                REFERENCES tests(test_id)
                ON UPDATE CASCADE
                ON DELETE RESTRICT
        ) ENGINE=InnoDB;
        """,

        # lab_settings
        """
        CREATE TABLE IF NOT EXISTS lab_settings (
            setting_key     VARCHAR(50) PRIMARY KEY,
            setting_value   TEXT NOT NULL
        ) ENGINE=InnoDB;
        """,

        # activity_log
        """
        CREATE TABLE IF NOT EXISTS activity_log (
            log_id          INT AUTO_INCREMENT PRIMARY KEY,
            action          VARCHAR(50) NOT NULL,
            entity_type     VARCHAR(50) NOT NULL,
            entity_id       INT NULL,
            description     TEXT,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
        """
    ]

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        for ddl in ddl_statements:
            cursor.execute(ddl)
        conn.commit()
        cursor.close()
        conn.close()
        print("[DB] All tables are ensured (created if missing).")
    except Error as e:
        print(f"[DB ERROR] Failed to create tables: {e}")
        raise


def init_db():
    """
    Public function to be called on app startup.
    Ensures database and tables exist.
    """
    create_database_if_not_exists()
    create_tables_if_not_exist()
