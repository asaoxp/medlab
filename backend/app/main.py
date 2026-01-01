import os
from datetime import datetime, timedelta, date
from typing import Optional, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# CONFIGURATION
# ============================================================

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "medlab_db")

app = FastAPI(title="MedLAB+ Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# RAW DB CONNECTION
# ============================================================
def get_raw_connection(include_db: bool = True):
    cfg = {
        "host": DB_HOST,
        "port": DB_PORT,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "autocommit": False,
    }
    if include_db:
        cfg["database"] = DB_NAME
    return mysql.connector.connect(**cfg)

# ============================================================
# INITIALIZE DATABASE & TABLES
# ============================================================
def init_database_and_tables():
    # Create DB if not exists
    conn = get_raw_connection(include_db=False)
    c = conn.cursor()
    c.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
    conn.commit()
    c.close()
    conn.close()

    # Connect to DB
    conn = get_raw_connection(include_db=True)
    cursor = conn.cursor()

    # Patients
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            patient_id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            date_of_birth DATE NULL,
            gender ENUM('M','F','O') NULL,
            phone VARCHAR(32) NULL,
            email VARCHAR(255) NULL,
            address VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Doctors
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            doctor_id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            specialization VARCHAR(255) NULL,
            phone VARCHAR(32) NULL,
            email VARCHAR(255) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Test Categories
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_categories (
            category_id INT AUTO_INCREMENT PRIMARY KEY,
            category_name VARCHAR(255) NOT NULL
        )
    """)

    # Tests
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tests (
            test_id INT AUTO_INCREMENT PRIMARY KEY,
            test_name VARCHAR(255) NOT NULL,
            category_id INT NULL,
            sample_type VARCHAR(64) NULL,
            unit VARCHAR(32) NULL,
            normal_min DECIMAL(10,2) NULL,
            normal_max DECIMAL(10,2) NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            FOREIGN KEY (category_id) REFERENCES test_categories(category_id) ON DELETE SET NULL
        )
    """)

    # Reference Ranges
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_reference_ranges (
            range_id INT AUTO_INCREMENT PRIMARY KEY,
            test_id INT NOT NULL,
            gender ENUM('M','F','ANY') NOT NULL DEFAULT 'ANY',
            age_min INT NULL,
            age_max INT NULL,
            normal_min DECIMAL(10,2) NULL,
            normal_max DECIMAL(10,2) NULL,
            unit VARCHAR(32) NULL,
            notes VARCHAR(255) NULL,
            FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE
        )
    """)

    # Safe index creation
    try:
        cursor.execute("""
            CREATE INDEX idx_trr ON test_reference_ranges (test_id, gender, age_min, age_max)
        """)
    except mysql.connector.Error as e:
        if e.errno != 1061:
            raise

    # Test Orders
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            patient_id INT NOT NULL,
            doctor_id INT NULL,
            order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            priority ENUM('NORMAL','URGENT') NOT NULL DEFAULT 'NORMAL',
            status ENUM('PENDING','SAMPLE_COLLECTED','RESULTS_ENTERED','REPORT_READY')
                NOT NULL DEFAULT 'PENDING',
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            notes TEXT NULL,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
        )
    """)

    # Ordered Tests - FIXED SCHEMA
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_order_tests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            test_id INT NOT NULL,
            unit VARCHAR(32) NULL,
            normal_range_text VARCHAR(255) NULL,
            result_value DECIMAL(10,2) NULL,
            result_flag ENUM('LOW','NORMAL','HIGH') NULL,
            result_entered_at DATETIME NULL,
            FOREIGN KEY (order_id) REFERENCES test_orders(order_id) ON DELETE CASCADE,
            FOREIGN KEY (test_id) REFERENCES tests(test_id)
        )
    """)

    # Activity Log
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_log (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(64) NOT NULL,
            entity_type VARCHAR(32) NOT NULL,
            entity_id INT NULL,
            description TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Settings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key VARCHAR(255) PRIMARY KEY,
            setting_value TEXT NULL
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()


def get_db_connection():
    init_database_and_tables()
    return get_raw_connection(include_db=True)

# ============================================================
# Pydantic Models
# ============================================================

class PatientCreate(BaseModel):
    fullName: str
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class PatientUpdate(PatientCreate):
    pass

class TestCreate(BaseModel):
    testName: str
    sampleType: Optional[str] = None
    unit: Optional[str] = None
    normalMin: Optional[float] = None
    normalMax: Optional[float] = None
    price: float

class DoctorCreate(BaseModel):
    fullName: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class CreateOrderPayload(BaseModel):
    patientId: int
    doctorId: Optional[int] = None
    priority: str
    notes: Optional[str] = None
    testIds: List[int]

class OrderUpdate(BaseModel):
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TestResultItem(BaseModel):
    testId: int
    value: Optional[float] = None

class UpdateResultsPayload(BaseModel):
    results: List[TestResultItem]
    markCompleted: bool = True

class SettingsUpdatePayload(BaseModel):
    settings: Dict[str, str]

class SqlDemoPayload(BaseModel):
    query: str

# ============================================================
# Helper Mapping Functions
# ============================================================

def map_gender_to_db(g):
    if not g:
        return None
    g = g.lower()
    if g.startswith("m"): return "M"
    if g.startswith("f"): return "F"
    if g.startswith("o"): return "O"
    return None

def map_priority_to_db(p):
    return "URGENT" if p.lower() == "urgent" else "NORMAL"

def map_priority_from_db(p):
    return "urgent" if p == "URGENT" else "normal"

def map_status_to_db(s):
    s = s.lower()
    if s == "pending": return "PENDING"
    if s == "in-progress": return "RESULTS_ENTERED"
    return "REPORT_READY"

def map_status_from_db(s):
    if s == "PENDING": return "pending"
    if s in ("SAMPLE_COLLECTED", "RESULTS_ENTERED"):
        return "in-progress"
    return "completed"

# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

# ============================================================
# PATIENTS
# ============================================================

@app.get("/api/patients")
def list_patients():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM patients ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/patients")
def create_patient(payload: PatientCreate):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        g = map_gender_to_db(payload.gender)

        cur.execute("""
            INSERT INTO patients (full_name,date_of_birth,gender,phone,email,address)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            payload.fullName, payload.dateOfBirth, g,
            payload.phone, payload.email, payload.address
        ))
        pid = cur.lastrowid

        # Log
        cur.execute("""
            INSERT INTO activity_log(action,entity_type,entity_id,description)
            VALUES ('CREATE_PATIENT','PATIENT',%s,'New patient created')
        """, (pid,))

        conn.commit()

        cur.execute("SELECT * FROM patients WHERE patient_id=%s", (pid,))
        row = cur.fetchone()

        cur.close()
        conn.close()
        return row

    except Exception as e:
        raise HTTPException(400, str(e))

# ============================================================
# TESTS
# ============================================================

@app.get("/api/tests")
def list_tests():
    """
    Returns tests with ANY/M/F reference ranges combined.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT t.test_id,t.test_name,t.sample_type,t.unit,t.price,c.category_name
            FROM tests t
            LEFT JOIN test_categories c ON t.category_id=c.category_id
            WHERE t.is_active=1
            ORDER BY t.test_name
        """)
        tests = cur.fetchall()

        cur2 = conn.cursor(dictionary=True)

        def build_text(r, default_unit):
            if r["normal_min"] is None or r["normal_max"] is None:
                return None
            unit = r["unit"] or default_unit or ""
            mn = ("%g" % float(r["normal_min"]))
            mx = ("%g" % float(r["normal_max"]))
            return f"{mn} - {mx}{(' ' + unit) if unit else ''}"

        # Attach ANY / MALE / FEMALE ranges
        for t in tests:
            cur2.execute("""
                SELECT gender,normal_min,normal_max,unit
                FROM test_reference_ranges
                WHERE test_id=%s
            """, (t["test_id"],))
            rows = cur2.fetchall()

            t["any_range_text"] = None
            t["male_range_text"] = None
            t["female_range_text"] = None

            for r in rows:
                txt = build_text(r, t["unit"])
                if not txt:
                    continue
                if r["gender"] == "ANY":
                    t["any_range_text"] = txt
                elif r["gender"] == "M":
                    t["male_range_text"] = txt
                elif r["gender"] == "F":
                    t["female_range_text"] = txt

        cur.close()
        cur2.close()
        conn.close()
        return tests

    except Exception as e:
        raise HTTPException(500, str(e))

# ============================================================
# DOCTORS
# ============================================================

@app.get("/api/doctors")
def list_doctors():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM doctors ORDER BY full_name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/doctors")
def create_doctor(payload: DoctorCreate):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            INSERT INTO doctors (full_name,specialization,phone,email)
            VALUES (%s,%s,%s,%s)
        """, (
            payload.fullName,
            payload.specialization,
            payload.phone,
            payload.email
        ))
        did = cur.lastrowid

        cur.execute("""
            INSERT INTO activity_log(action,entity_type,entity_id,description)
            VALUES ('CREATE_DOCTOR','DOCTOR',%s,'New doctor created')
        """, (did,))

        conn.commit()

        cur.execute("SELECT * FROM doctors WHERE doctor_id=%s", (did,))
        row = cur.fetchone()

        cur.close()
        conn.close()
        return row

    except Exception as e:
        raise HTTPException(400, str(e))

# ============================================================
# ORDERS (List / Create / Get / Update)
# ============================================================

@app.get("/api/orders")
def list_orders():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT 
                o.order_id,
                p.full_name AS patient_name,
                o.order_date,
                o.priority,
                o.status,
                (
                    SELECT COUNT(*) 
                    FROM test_order_tests t 
                    WHERE t.order_id = o.order_id
                ) AS tests_count
            FROM test_orders o
            JOIN patients p ON p.patient_id = o.patient_id
            ORDER BY o.order_date DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        # Map enums → frontend format
        for r in rows:
            r["priority"] = map_priority_from_db(r["priority"])
            r["status"] = map_status_from_db(r["status"])

        return rows

    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/api/orders")
def create_order(payload: CreateOrderPayload):
    if not payload.testIds:
        raise HTTPException(400, "At least one test is required")

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # Calculate total price
        ids_fmt = ",".join(["%s"] * len(payload.testIds))
        cur.execute(f"""
            SELECT test_id, price 
            FROM tests 
            WHERE test_id IN ({ids_fmt})
        """, tuple(payload.testIds))

        total = sum(float(r["price"]) for r in cur.fetchall())

        # Insert order
        cur.execute("""
            INSERT INTO test_orders 
            (patient_id, doctor_id, priority, status, total_amount, notes)
            VALUES (%s, %s, %s, 'PENDING', %s, %s)
        """, (
            payload.patientId,
            payload.doctorId,
            map_priority_to_db(payload.priority),
            total,
            payload.notes
        ))

        order_id = cur.lastrowid

        # Insert test list
        for test_id in payload.testIds:
            cur.execute("SELECT unit FROM tests WHERE test_id=%s", (test_id,))
            udata = cur.fetchone()
            unit_val = udata["unit"] if udata else None

            cur.execute("""
                SELECT normal_min, normal_max, unit
                FROM test_reference_ranges
                WHERE test_id=%s AND gender='ANY'
                LIMIT 1
            """, (test_id,))
            rng = cur.fetchone()

            normal_text = None
            if rng and rng["normal_min"] is not None:
                mn = ("%g" % float(rng["normal_min"]))
                mx = ("%g" % float(rng["normal_max"]))
                use_unit = rng["unit"] or unit_val or ""
                normal_text = f"{mn} - {mx}{(' ' + use_unit) if use_unit else ''}"

            cur.execute("""
                INSERT INTO test_order_tests (order_id, test_id, unit, normal_range_text)
                VALUES (%s,%s,%s,%s)
            """, (order_id, test_id, unit_val, normal_text))

        # log
        cur.execute("""
            INSERT INTO activity_log(action, entity_type, entity_id, description)
            VALUES ('CREATE_ORDER','ORDER',%s,'Order created')
        """, (order_id,))

        conn.commit()
        cur.close()
        conn.close()

        return {"order_id": order_id}

    except Exception as e:
        raise HTTPException(400, str(e))


@app.get("/api/orders/{order_id}")
def get_order(order_id: int):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT 
                o.*, 
                p.full_name AS patient_name,
                p.date_of_birth AS patient_dob,
                p.gender AS patient_gender,
                d.full_name AS doctor_name,
                d.specialization AS doctor_specialization
            FROM test_orders o
            JOIN patients p ON p.patient_id = o.patient_id
            LEFT JOIN doctors d ON d.doctor_id = o.doctor_id
            WHERE o.order_id = %s
        """, (order_id,))
        order = cur.fetchone()

        if not order:
            raise HTTPException(404, "Order not found")

        order["priority"] = map_priority_from_db(order["priority"])
        order["status"] = map_status_from_db(order["status"])

        cur2 = conn.cursor(dictionary=True)
        cur2.execute("""
            SELECT 
                tot.test_id,
                t.test_name,
                tot.unit,
                tot.normal_range_text,
                tot.result_value,
                t.price
            FROM test_order_tests tot
            JOIN tests t ON t.test_id = tot.test_id
            WHERE tot.order_id=%s
        """, (order_id,))

        order["tests"] = cur2.fetchall()

        cur.close()
        cur2.close()
        conn.close()
        return order

    except Exception as e:
        raise HTTPException(500, str(e))


@app.put("/api/orders/{order_id}")
def update_order(order_id: int, payload: OrderUpdate):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        updates = []
        vals = []

        if payload.priority:
            updates.append("priority=%s")
            vals.append(map_priority_to_db(payload.priority))

        if payload.status:
            updates.append("status=%s")
            vals.append(map_status_to_db(payload.status))

        if payload.notes is not None:
            updates.append("notes=%s")
            vals.append(payload.notes)

        if not updates:
            raise HTTPException(400, "Nothing to update")

        vals.append(order_id)

        cur.execute(f"""
            UPDATE test_orders 
            SET {', '.join(updates)} 
            WHERE order_id=%s
        """, tuple(vals))

        cur.execute("""
            INSERT INTO activity_log(action, entity_type, entity_id, description)
            VALUES ('UPDATE_ORDER','ORDER',%s,'Order updated')
        """, (order_id,))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "ok"}

    except Exception as e:
        raise HTTPException(400, str(e))


# ============================================================
# UPDATE TEST RESULTS - FIXED VERSION
# ============================================================

@app.put("/api/orders/{order_id}/results")
def update_results(order_id: int, payload: UpdateResultsPayload):
    """
    Updates test_order_tests.result_value for each test.
    Automatically marks order as REPORT_READY unless markCompleted=False.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # 1) Verify order exists
        cur.execute("SELECT order_id FROM test_orders WHERE order_id=%s", (order_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Order not found")

        # 2) Update each test result
        for item in payload.results:
            # Check if this test exists in the order
            cur.execute("""
                SELECT id FROM test_order_tests 
                WHERE order_id=%s AND test_id=%s
            """, (order_id, item.testId))
            
            if cur.fetchone() is None:
                continue  # Skip if test not in order
            
            # Update the result
            cur.execute("""
                UPDATE test_order_tests
                SET 
                    result_value=%s,
                    result_entered_at=NOW()
                WHERE order_id=%s AND test_id=%s
            """, (item.value, order_id, item.testId))

        # 3) Mark order as completed if requested
        if payload.markCompleted:
            cur.execute("""
                UPDATE test_orders
                SET status='REPORT_READY'
                WHERE order_id=%s
            """, (order_id,))

        # 4) Log activity
        cur.execute("""
            INSERT INTO activity_log(action, entity_type, entity_id, description)
            VALUES ('UPDATE_RESULTS','ORDER',%s,'Test results updated')
        """, (order_id,))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "ok", "message": "Results updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        today = date.today()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)

        # Orders today
        cur.execute(
            "SELECT COUNT(*) AS c FROM test_orders WHERE DATE(order_date)=%s",
            (today,)
        )
        orders_today = cur.fetchone()["c"]

        # Orders yesterday
        cur.execute(
            "SELECT COUNT(*) AS c FROM test_orders WHERE DATE(order_date)=%s",
            (yesterday,)
        )
        orders_yesterday = cur.fetchone()["c"]

        # Pending & urgent pending
        cur.execute("""
            SELECT
                SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN status='PENDING' AND priority='URGENT' THEN 1 ELSE 0 END) AS urgent_pending
            FROM test_orders
        """)
        pr = cur.fetchone()

        # Completed today + yesterday
        cur.execute("""
            SELECT
              SUM(CASE WHEN status='REPORT_READY' AND DATE(order_date)=%s THEN 1 ELSE 0 END) AS comp_today,
              SUM(CASE WHEN status='REPORT_READY' AND DATE(order_date)=%s THEN 1 ELSE 0 END) AS comp_yest
            FROM test_orders
        """, (today, yesterday))
        comp = cur.fetchone()

        # Total patients
        cur.execute("SELECT COUNT(*) AS c FROM patients")
        total_patients = cur.fetchone()["c"]

        # New patients this week
        cur.execute(
            "SELECT COUNT(*) AS c FROM patients WHERE DATE(created_at)>=%s",
            (week_ago,)
        )
        new_patients = cur.fetchone()["c"]

        # Orders last 7 days
        cur.execute("""
            SELECT DATE(order_date) AS d,COUNT(*) AS c
            FROM test_orders
            WHERE DATE(order_date)>=%s
            GROUP BY DATE(order_date)
            ORDER BY d
        """, (week_ago,))
        last7 = [
            {"date": row["d"].isoformat(), "count": row["c"]}
            for row in cur.fetchall()
        ]

        cur.close()
        conn.close()

        return {
            "stats": {
                "ordersToday": orders_today,
                "ordersYesterday": orders_yesterday,
                "pendingReports": pr["pending_count"] or 0,
                "urgentPendingReports": pr["urgent_pending"] or 0,
                "completedReports": comp["comp_today"] or 0,
                "completedYesterday": comp["comp_yest"] or 0,
                "totalPatients": total_patients,
                "newPatientsThisWeek": new_patients
            },
            "ordersLast7Days": last7
        }

    except Exception as e:
        raise HTTPException(500, str(e))


# ============================================================
# REPORTS
# ============================================================

@app.get("/api/reports")
def list_reports():
    """
    Returns completed reports only.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT 
                o.order_id,
                p.full_name AS patient_name,
                o.order_date,
                o.priority,
                o.status,
                o.total_amount
            FROM test_orders o
            JOIN patients p ON o.patient_id = p.patient_id
            WHERE o.status='REPORT_READY'
            ORDER BY o.order_date DESC
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        # map priority + status
        for r in rows:
            r["priority"] = map_priority_from_db(r["priority"])
            r["status"] = "completed"

        return rows

    except Exception as e:
        raise HTTPException(500, str(e))


# ============================================================
# ACTIVITY LOG
# ============================================================

@app.get("/api/activity")
def list_activity(limit: int = 50):
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT *
            FROM activity_log
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))

        rows = cur.fetchall()

        cur.close()
        conn.close()

        return rows

    except Exception as e:
        raise HTTPException(500, str(e))


# ============================================================
# SETTINGS
# ============================================================

@app.get("/api/settings")
def get_settings():
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT * FROM app_settings")
        rows = cur.fetchall()

        cur.close()
        conn.close()

        settings = {
            row["setting_key"]: (row["setting_value"] or "")
            for row in rows
        }

        return {"settings": settings}

    except Exception as e:
        raise HTTPException(500, str(e))


@app.put("/api/settings")
def update_settings(payload: SettingsUpdatePayload):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        for key, value in payload.settings.items():
            cur.execute("""
                INSERT INTO app_settings(setting_key, setting_value)
                VALUES(%s, %s)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            """, (key, value))

        cur.execute("""
            INSERT INTO activity_log(action, entity_type, description)
            VALUES ('UPDATE_SETTINGS','SETTINGS','Settings updated')
        """)

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "ok"}

    except Exception as e:
        raise HTTPException(400, str(e))

# ============================================================
# SQL DEMO (READ ONLY)
# ============================================================

FORBIDDEN = ("insert", "update", "delete", "drop", "alter", "create", "truncate")

@app.post("/api/sql-demo")
def sql_demo(payload: SqlDemoPayload):
    q = payload.query.strip()

    if not q:
        raise HTTPException(400, "Query empty.")

    first = q.split()[0].lower()
    if first in FORBIDDEN or not q.lower().startswith("select"):
        raise HTTPException(400, "Only safe SELECT queries allowed.")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        t0 = datetime.now()
        cur.execute(q)
        rows = cur.fetchall()
        t1 = datetime.now()

        columns = [c[0] for c in cur.description]

        cur.close()
        conn.close()

        # Convert to JSON safe output
        safe_rows = []
        for row in rows:
            out = []
            for col in row:
                if isinstance(col, datetime):
                    out.append(col.isoformat())
                elif isinstance(col, date):
                    out.append(col.isoformat())
                else:
                    out.append(col)
            safe_rows.append(out)

        return {
            "columns": columns,
            "rows": safe_rows,
            "rowCount": len(safe_rows),
            "timeMs": (t1 - t0).total_seconds() * 1000
        }

    except Exception as e:
        raise HTTPException(400, str(e))


# ============================================================
# STARTUP EVENT
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        init_database_and_tables()
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")


# ============================================================
# END OF FILE
# ============================================================