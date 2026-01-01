"""
Mock Data Generator for MedLAB+ Database
Generates realistic test data for all tables
"""
import mysql.connector
from datetime import datetime, timedelta
import random

def get_db_connection(host, port, user, password, database):
    """Create database connection"""
    return mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
    )


def clear_all_data(conn):
    """Clear all existing data (in correct order due to foreign keys)"""
    cursor = conn.cursor()
    
    tables = [
        'activity_log',
        'test_order_tests',
        'test_orders',
        'test_reference_ranges',
        'tests',
        'test_categories',
        'doctors',
        'patients',
        'lab_settings',
        'app_settings'
    ]
    
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table}")
            print(f"✓ Cleared {table}")
        except Exception as e:
            print(f"⚠ Could not clear {table}: {e}")
    
    conn.commit()
    cursor.close()


def insert_test_categories(conn):
    """Insert test categories"""
    cursor = conn.cursor()
    
    categories = [
        ('Hematology', 'Blood cell counts and related tests'),
        ('Clinical Chemistry', 'Blood chemistry and metabolic tests'),
        ('Lipid Profile', 'Cholesterol and lipid tests'),
        ('Diabetes Panel', 'Blood sugar and diabetes tests'),
        ('Kidney Function', 'Renal function tests'),
        ('Liver Function', 'Hepatic function tests'),
        ('Thyroid Function', 'Thyroid hormone tests'),
        ('Urine Analysis', 'Urine tests'),
        ('Radiology', 'Imaging tests'),
        ('Serology', 'Antibody and antigen tests'),
    ]
    
    for name, desc in categories:
        cursor.execute("""
            INSERT INTO test_categories (category_name, description)
            VALUES (%s, %s)
        """, (name, desc))
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted {len(categories)} test categories")


def insert_tests(conn):
    """Insert comprehensive test list"""
    cursor = conn.cursor()
    
    tests = [
        # Hematology (category_id=1)
        ('Complete Blood Count (CBC)', 1, 'Blood', None, None, None, 400, 1),
        ('Hemoglobin (Hb)', 1, 'Blood', 'g/dL', None, None, 250, 1),
        ('Total Leukocyte Count (TLC)', 1, 'Blood', 'cells/µL', 4000, 11000, 200, 1),
        ('Platelet Count', 1, 'Blood', 'lakh/µL', 1.5, 4.5, 220, 1),
        ('ESR (Erythrocyte Sedimentation Rate)', 1, 'Blood', 'mm/hr', 0, 20, 180, 1),
        
        # Clinical Chemistry (category_id=2)
        ('Blood Urea', 2, 'Blood', 'mg/dL', 15, 40, 220, 1),
        ('Serum Creatinine', 2, 'Blood', 'mg/dL', None, None, 300, 1),
        ('Uric Acid', 2, 'Blood', 'mg/dL', 3.5, 7.2, 280, 1),
        ('Serum Calcium', 2, 'Blood', 'mg/dL', 8.5, 10.5, 300, 1),
        ('Serum Sodium', 2, 'Blood', 'mEq/L', 135, 145, 250, 1),
        ('Serum Potassium', 2, 'Blood', 'mEq/L', 3.5, 5.5, 250, 1),
        
        # Lipid Profile (category_id=3)
        ('Lipid Profile', 3, 'Blood', 'mg/dL', None, None, 800, 1),
        ('Total Cholesterol', 3, 'Blood', 'mg/dL', 0, 200, 350, 1),
        ('HDL Cholesterol', 3, 'Blood', 'mg/dL', None, None, 350, 1),
        ('LDL Cholesterol', 3, 'Blood', 'mg/dL', 0, 100, 350, 1),
        ('Triglycerides', 3, 'Blood', 'mg/dL', 0, 150, 350, 1),
        ('VLDL Cholesterol', 3, 'Blood', 'mg/dL', 5, 40, 300, 1),
        
        # Diabetes Panel (category_id=4)
        ('Fasting Blood Sugar', 4, 'Blood', 'mg/dL', 70, 100, 200, 1),
        ('Fasting Blood Glucose (FBS)', 4, 'Blood', 'mg/dL', 70, 99, 180, 1),
        ('Postprandial Blood Sugar (PPBS)', 4, 'Blood', 'mg/dL', 80, 140, 200, 1),
        ('HbA1c', 4, 'Blood', '%', 4, 5.6, 400, 1),
        ('Random Blood Sugar (RBS)', 4, 'Blood', 'mg/dL', 70, 140, 150, 1),
        
        # Kidney Function (category_id=5)
        ('Blood Urea Nitrogen (BUN)', 5, 'Blood', 'mg/dL', 7, 20, 250, 1),
        ('eGFR (Estimated GFR)', 5, 'Blood', 'mL/min', 90, 120, 400, 1),
        ('Microalbumin Urine', 5, 'Urine', 'mg/L', 0, 30, 500, 1),
        
        # Liver Function (category_id=6)
        ('SGPT / ALT', 6, 'Blood', 'U/L', 7, 56, 280, 1),
        ('SGOT / AST', 6, 'Blood', 'U/L', 10, 40, 280, 1),
        ('Alkaline Phosphatase', 6, 'Blood', 'U/L', 30, 120, 300, 1),
        ('Bilirubin Total', 6, 'Blood', 'mg/dL', 0.3, 1.2, 280, 1),
        ('Bilirubin Direct', 6, 'Blood', 'mg/dL', 0, 0.3, 280, 1),
        ('Total Protein', 6, 'Blood', 'g/dL', 6, 8, 250, 1),
        ('Albumin', 6, 'Blood', 'g/dL', 3.5, 5.5, 250, 1),
        
        # Thyroid Function (category_id=7)
        ('TSH (Thyroid Stimulating Hormone)', 7, 'Blood', 'µIU/mL', 0.27, 4.2, 450, 1),
        ('T3 (Triiodothyronine)', 7, 'Blood', 'ng/dL', 80, 200, 400, 1),
        ('T4 (Thyroxine)', 7, 'Blood', 'µg/dL', 4.5, 12, 400, 1),
        ('Free T3', 7, 'Blood', 'pg/mL', 2, 4.4, 500, 1),
        ('Free T4', 7, 'Blood', 'ng/dL', 0.8, 1.8, 500, 1),
        
        # Urine Analysis (category_id=8)
        ('Urine Routine', 8, 'Urine', None, None, None, 250, 1),
        ('Urine Culture', 8, 'Urine', None, None, None, 600, 1),
        ('24-Hour Urine Protein', 8, 'Urine', 'mg/24h', 0, 150, 450, 1),
        
        # Radiology (category_id=9)
        ('Chest X-Ray', 9, 'Imaging', None, None, None, 1000, 1),
        ('Ultrasound Abdomen', 9, 'Imaging', None, None, None, 1500, 1),
        ('ECG', 9, 'Cardiac', None, None, None, 300, 1),
        
        # Serology (category_id=10)
        ('Vitamin D', 10, 'Blood', 'ng/mL', 30, 100, 1200, 1),
        ('Vitamin B12', 10, 'Blood', 'pg/mL', 200, 900, 800, 1),
        ('Iron Studies', 10, 'Blood', 'µg/dL', 60, 170, 600, 1),
    ]
    
    for test_data in tests:
        cursor.execute("""
            INSERT INTO tests (test_name, category_id, sample_type, unit, 
                             normal_min, normal_max, price, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, test_data)
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted {len(tests)} tests")


def insert_reference_ranges(conn):
    """Insert gender-specific reference ranges"""
    cursor = conn.cursor()
    
    # Get test IDs
    cursor.execute("SELECT test_id, test_name FROM tests")
    tests = {name: tid for tid, name in cursor.fetchall()}
    
    ranges = [
        # Hemoglobin - gender specific
        (tests['Hemoglobin (Hb)'], 'M', None, None, 13, 17, 'g/dL', 'Normal range for adult males'),
        (tests['Hemoglobin (Hb)'], 'F', None, None, 12, 15, 'g/dL', 'Normal range for adult females'),
        
        # HDL Cholesterol - gender specific
        (tests['HDL Cholesterol'], 'M', None, None, 40, 999, 'mg/dL', 'Higher is better for males'),
        (tests['HDL Cholesterol'], 'F', None, None, 50, 999, 'mg/dL', 'Higher is better for females'),
        
        # Serum Creatinine - gender specific
        (tests['Serum Creatinine'], 'M', None, None, 0.7, 1.3, 'mg/dL', 'Normal range for males'),
        (tests['Serum Creatinine'], 'F', None, None, 0.6, 1.1, 'mg/dL', 'Normal range for females'),
        
        # ESR - gender specific
        (tests['ESR (Erythrocyte Sedimentation Rate)'], 'M', None, None, 0, 15, 'mm/hr', 'Males'),
        (tests['ESR (Erythrocyte Sedimentation Rate)'], 'F', None, None, 0, 20, 'mm/hr', 'Females'),
        
        # Uric Acid - gender specific
        (tests['Uric Acid'], 'M', None, None, 3.5, 7.2, 'mg/dL', 'Males'),
        (tests['Uric Acid'], 'F', None, None, 2.6, 6.0, 'mg/dL', 'Females'),
        
        # Generic ANY ranges for tests without gender differences
        (tests['Fasting Blood Glucose (FBS)'], 'ANY', None, None, 70, 99, 'mg/dL', 'Normal fasting glucose'),
        (tests['Postprandial Blood Sugar (PPBS)'], 'ANY', None, None, 80, 140, 'mg/dL', '2 hours after meal'),
        (tests['HbA1c'], 'ANY', None, None, 4, 5.6, '%', 'Normal glycemic control'),
        (tests['Total Cholesterol'], 'ANY', None, None, 0, 200, 'mg/dL', 'Desirable level'),
        (tests['Triglycerides'], 'ANY', None, None, 0, 150, 'mg/dL', 'Normal level'),
        (tests['TSH (Thyroid Stimulating Hormone)'], 'ANY', None, None, 0.27, 4.2, 'µIU/mL', 'Normal thyroid function'),
        (tests['Total Leukocyte Count (TLC)'], 'ANY', None, None, 4000, 11000, 'cells/µL', 'Normal WBC count'),
        (tests['Platelet Count'], 'ANY', None, None, 1.5, 4.5, 'lakh/µL', 'Normal platelet count'),
    ]
    
    for range_data in ranges:
        cursor.execute("""
            INSERT INTO test_reference_ranges 
            (test_id, gender, age_min, age_max, normal_min, normal_max, unit, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, range_data)
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted {len(ranges)} reference ranges")


def insert_patients(conn):
    """Insert sample patients"""
    cursor = conn.cursor()
    
    first_names_male = ['Rajesh', 'Amit', 'Suresh', 'Vikram', 'Rahul', 'Anil', 'Deepak', 'Manoj', 'Kiran', 'Sachin']
    first_names_female = ['Priya', 'Anjali', 'Sneha', 'Kavita', 'Pooja', 'Rekha', 'Neha', 'Swati', 'Divya', 'Meera']
    last_names = ['Kumar', 'Sharma', 'Reddy', 'Rao', 'Patel', 'Singh', 'Iyer', 'Nair', 'Gupta', 'Verma', 'Joshi', 'Desai']
    
    patients = []
    
    # Generate 50 patients
    for i in range(50):
        gender = random.choice(['M', 'F'])
        first_name = random.choice(first_names_male if gender == 'M' else first_names_female)
        last_name = random.choice(last_names)
        full_name = f"{first_name} {last_name}"
        
        # Age between 18-80
        age = random.randint(18, 80)
        dob = datetime.now() - timedelta(days=age*365 + random.randint(0, 365))
        
        phone = f"+91-{random.randint(7000000000, 9999999999)}"
        email = f"{first_name.lower()}.{last_name.lower()}@email.com"
        
        areas = ['Jayanagar', 'Koramangala', 'Indiranagar', 'Malleshwaram', 'Rajajinagar', 'Hebbal', 'Whitefield']
        address = f"{random.randint(1, 999)}, {random.choice(areas)}, Mysuru, Karnataka"
        
        patients.append((full_name, dob.date(), gender, phone, email, address))
    
    cursor.executemany("""
        INSERT INTO patients (full_name, date_of_birth, gender, phone, email, address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, patients)
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted {len(patients)} patients")


def insert_doctors(conn):
    """Insert sample doctors"""
    cursor = conn.cursor()
    
    doctors = [
        ('Dr. Ramesh Kumar', 'General Physician', '+91-9845012345', 'dr.ramesh@medlab.com'),
        ('Dr. Sunita Sharma', 'Cardiologist', '+91-9845012346', 'dr.sunita@medlab.com'),
        ('Dr. Arun Reddy', 'Endocrinologist', '+91-9845012347', 'dr.arun@medlab.com'),
        ('Dr. Kavita Iyer', 'Nephrologist', '+91-9845012348', 'dr.kavita@medlab.com'),
        ('Dr. Vijay Patel', 'Pathologist', '+91-9845012349', 'dr.vijay@medlab.com'),
        ('Dr. Anjali Rao', 'Radiologist', '+91-9845012350', 'dr.anjali@medlab.com'),
        ('Dr. Manoj Singh', 'General Surgeon', '+91-9845012351', 'dr.manoj@medlab.com'),
        ('Dr. Priya Nair', 'Pediatrician', '+91-9845012352', 'dr.priya@medlab.com'),
        ('Dr. Suresh Gupta', 'Gastroenterologist', '+91-9845012353', 'dr.suresh@medlab.com'),
        ('Dr. Lakshmi Desai', 'Gynecologist', '+91-9845012354', 'dr.lakshmi@medlab.com'),
    ]
    
    cursor.executemany("""
        INSERT INTO doctors (full_name, specialization, phone, email)
        VALUES (%s, %s, %s, %s)
    """, doctors)
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted {len(doctors)} doctors")


def insert_orders_and_results(conn):
    """Insert sample test orders with some results"""
    cursor = conn.cursor()
    
    # Get patient and doctor IDs
    cursor.execute("SELECT patient_id FROM patients")
    patient_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT doctor_id FROM doctors")
    doctor_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT test_id, price FROM tests")
    test_data = cursor.fetchall()
    
    statuses = ['PENDING', 'SAMPLE_COLLECTED', 'RESULTS_ENTERED', 'REPORT_READY']
    priorities = ['NORMAL', 'URGENT']
    
    # Generate 100 orders over last 30 days
    for i in range(100):
        patient_id = random.choice(patient_ids)
        doctor_id = random.choice(doctor_ids) if random.random() > 0.2 else None
        
        # Random date in last 30 days
        days_ago = random.randint(0, 30)
        order_date = datetime.now() - timedelta(days=days_ago)
        
        priority = random.choice(priorities)
        status = random.choice(statuses)
        
        # Select 1-5 random tests
        num_tests = random.randint(1, 5)
        selected_tests = random.sample(test_data, num_tests)
        total_amount = sum(test[1] for test in selected_tests)
        
        notes_options = [
            'Routine checkup',
            'Follow-up tests',
            'Pre-employment medical',
            'Annual health screening',
            'Doctor referral',
            None
        ]
        notes = random.choice(notes_options)
        
        # Insert order
        cursor.execute("""
            INSERT INTO test_orders 
            (patient_id, doctor_id, order_date, priority, status, total_amount, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (patient_id, doctor_id, order_date, priority, status, total_amount, notes))
        
        order_id = cursor.lastrowid
        
        # Insert order tests
        for test_id, price in selected_tests:
            # Get test details
            cursor.execute("""
                SELECT unit, normal_min, normal_max 
                FROM tests 
                WHERE test_id=%s
            """, (test_id,))
            test_info = cursor.fetchone()
            unit = test_info[0] if test_info else None
            
            # Get reference range
            cursor.execute("""
                SELECT normal_min, normal_max, unit
                FROM test_reference_ranges
                WHERE test_id=%s AND gender='ANY'
                LIMIT 1
            """, (test_id,))
            range_info = cursor.fetchone()
            
            normal_range_text = None
            if range_info and range_info[0] is not None:
                use_unit = range_info[2] or unit or ''
                normal_range_text = f"{range_info[0]} - {range_info[1]}{(' ' + use_unit) if use_unit else ''}"
            
            # Generate result if status is completed
            result_value = None
            result_flag = None
            result_entered_at = None
            
            if status in ('RESULTS_ENTERED', 'REPORT_READY'):
                if range_info and range_info[0] is not None:
                    min_val = float(range_info[0])
                    max_val = float(range_info[1])
                    
                    # 70% normal, 15% low, 15% high
                    rand = random.random()
                    if rand < 0.7:
                        result_value = round(random.uniform(min_val, max_val), 2)
                        result_flag = 'NORMAL'
                    elif rand < 0.85:
                        result_value = round(random.uniform(min_val * 0.5, min_val * 0.95), 2)
                        result_flag = 'LOW'
                    else:
                        result_value = round(random.uniform(max_val * 1.05, max_val * 1.5), 2)
                        result_flag = 'HIGH'
                    
                    result_entered_at = order_date + timedelta(hours=random.randint(2, 48))
            
            cursor.execute("""
                INSERT INTO test_order_tests 
                (order_id, test_id, unit, normal_range_text, result_value, result_flag, result_entered_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (order_id, test_id, unit, normal_range_text, result_value, result_flag, result_entered_at))
        
        # Add activity log
        cursor.execute("""
            INSERT INTO activity_log (action, entity_type, entity_id, description)
            VALUES ('CREATE_ORDER', 'ORDER', %s, 'Order created via mock data')
        """, (order_id,))
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted 100 test orders with results")


def insert_settings(conn):
    """Insert lab settings"""
    cursor = conn.cursor()
    
    settings = [
        ('lab_name', 'MedLAB+ Diagnostic Center'),
        ('lab_address', '123 Medical Complex, Mysuru, Karnataka - 570001'),
        ('lab_phone', '+91-821-2345678'),
        ('lab_email', 'contact@medlabplus.com'),
        ('lab_license', 'KA-MYS-LAB-2024-12345'),
        ('report_header', 'Accredited Laboratory - ISO 9001:2015 Certified'),
        ('report_footer', 'This report is computer generated and does not require signature'),
    ]
    
    for key, value in settings:
        cursor.execute("""
            INSERT INTO app_settings (setting_key, setting_value)
            VALUES (%s, %s)
        """, (key, value))
    
    conn.commit()
    cursor.close()
    print(f"✓ Inserted {len(settings)} lab settings")


def generate_mock_data(host='localhost', port=3306, user='root', password='', database='medlab_db', clear_existing=True):
    """
    Main function to generate all mock data
    
    Args:
        host: Database host
        port: Database port
        user: Database user
        password: Database password
        database: Database name
        clear_existing: Whether to clear existing data first
    """
    print("=" * 60)
    print("MedLAB+ Mock Data Generator")
    print("=" * 60)
    
    try:
        conn = get_db_connection(host, port, user, password, database)
        print(f"✓ Connected to database: {database}")
        
        if clear_existing:
            print("\n📌 Clearing existing data...")
            clear_all_data(conn)
        
        print("\n📌 Generating mock data...")
        print()
        
        insert_test_categories(conn)
        insert_tests(conn)
        insert_reference_ranges(conn)
        insert_patients(conn)
        insert_doctors(conn)
        insert_orders_and_results(conn)
        insert_settings(conn)
        
        conn.close()
        
        print()
        print("=" * 60)
        print("✅ Mock data generation completed successfully!")
        print("=" * 60)
        print()
        print("📊 Summary:")
        print("   • 10 Test Categories")
        print("   • 46 Different Tests")
        print("   • 18 Gender-specific Reference Ranges")
        print("   • 50 Patients")
        print("   • 10 Doctors")
        print("   • 100 Test Orders (with varying statuses)")
        print("   • Lab Settings configured")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error generating mock data: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Run standalone
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    generate_mock_data(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'medlab_db'),
        clear_existing=True
    )