from app.db.session import engine
from sqlalchemy import text

alter_stmts = [
    "ALTER TABLE payslips ADD COLUMN company VARCHAR(100) DEFAULT 'PeoplePay360 Inc.'",
    "ALTER TABLE payslips ADD COLUMN total_earnings FLOAT DEFAULT 0.0",
    "ALTER TABLE payslips ADD COLUMN total_employer_contributions FLOAT DEFAULT 0.0",
    "ALTER TABLE payslips ADD COLUMN total_employer_cost FLOAT DEFAULT 0.0",
    "ALTER TABLE payslips ADD COLUMN employee_snapshot JSON",
    "ALTER TABLE payslips ADD COLUMN contract_snapshot JSON",
    "ALTER TABLE payslips ADD COLUMN attendance_snapshot JSON",
    "ALTER TABLE payslips ADD COLUMN time_off_snapshot JSON",
    "ALTER TABLE payslips ADD COLUMN calculation_trace JSON",
    "ALTER TABLE payslips ADD COLUMN error_code VARCHAR(100)",
    "ALTER TABLE payslips ADD COLUMN error_message TEXT",
    "ALTER TABLE payslips ADD COLUMN computed_at DATETIME",
    "ALTER TABLE payslips ADD COLUMN finalized_at DATETIME",
    "ALTER TABLE payslip_lines ADD COLUMN quantity FLOAT DEFAULT 1.0",
    "ALTER TABLE payslip_lines ADD COLUMN rate FLOAT DEFAULT 100.0",
    "ALTER TABLE payslip_lines ADD COLUMN base_amount FLOAT DEFAULT 0.0",
    "ALTER TABLE payslip_lines ADD COLUMN total FLOAT DEFAULT 0.0",
    "ALTER TABLE payslip_lines ADD COLUMN calculation_type VARCHAR(50)",
    "ALTER TABLE payslip_lines ADD COLUMN calculation_expression TEXT",
    "ALTER TABLE payslip_lines ADD COLUMN is_employer_contribution BOOLEAN DEFAULT 0",
    "ALTER TABLE payslip_lines ADD COLUMN created_at DATETIME"
]

with engine.connect() as conn:
    for stmt in alter_stmts:
        try:
            conn.execute(text(stmt))
            conn.commit()
            print("Executed:", stmt[:50])
        except Exception as e:
            print("Skipped/Exists:", stmt[:50], "->", e)

print("Migration completed successfully.")
