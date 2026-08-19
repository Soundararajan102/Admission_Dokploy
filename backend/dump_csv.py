import os
import csv
import psycopg2
from dotenv import load_dotenv

# Load the dedicated migration environment file
_ = load_dotenv(".env.migration")
POSTGRES_URL = os.getenv("POSTGRES_URL")

# Connect to database
conn = psycopg2.connect(POSTGRES_URL)
conn.autocommit = True
cur = conn.cursor()

def dump_csv_to_table(csv_path, table_name):
    print(f"Loading {csv_path} into {table_name}...")
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
        if not rows:
            print("CSV is empty.")
            return
            
        # Get columns from CSV headers
        headers = [h for h in reader.fieldnames if h and h.strip()]
        
        # Ensure we add an 'id' column with UUID since SQLAlchemy handles this, not Postgres
        import uuid
        
        if 'id' not in headers:
            headers.append('id')
            
        columns = ', '.join([f'"{h}"' for h in headers])
        placeholders = ', '.join(['%s'] * len(headers))
        query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

        success_count = 0
        for row in rows:
            values = []
            for h in headers:
                if h == 'id' and h not in row:
                    values.append(str(uuid.uuid4()))
                else:
                    val = row.get(h, None)
                    values.append(val if val != "" else None)
            
            try:
                cur.execute(query, tuple(values))
                success_count += 1
            except Exception as e:
                print(f"Error inserting row: {e}")
                
        print(f"Successfully inserted {success_count} rows into {table_name}.")

student_records_csv = os.getenv("STUDENT_RECORDS_CSV", "C:/Users/sound/Downloads/Admission Sheet Server - StudentRecords.csv")
admitted_students_csv = os.getenv("ADMITTED_STUDENTS_CSV", "C:/Users/sound/Downloads/Admission Sheet Server - AdmittedStudents.csv")

dump_csv_to_table(student_records_csv, "student_records")
dump_csv_to_table(admitted_students_csv, "admitted_students")

cur.close()
conn.close()
