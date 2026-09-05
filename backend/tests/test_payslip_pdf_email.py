import pytest
import time
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User,
    UserRole,
    Employee,
    EmployeeStatus,
    Contract,
    ContractStatus,
    SalaryStructure,
    SalaryRule,
    RuleCategory,
    ComputationType,
    Payslip,
    PayslipLine,
    PayslipStatus,
    Payrun,
    PayrunStatus,
    PayslipDocument,
    PayslipEmailLog,
)

client = TestClient(app)


def get_auth_headers(email: str, password: str = "Admin123!"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def setup_pdf_email_data():
    db = SessionLocal()
    try:
        ts = int(time.time())
        # Salary Structure
        struct = SalaryStructure(
            name=f"PDF Test Structure {ts}",
            code=f"PDF_TEST_{ts}",
            company="PeoplePay360 Inc.",
            pay_frequency="monthly",
            active=True,
        )
        db.add(struct)
        db.commit()
        db.refresh(struct)

        # Rules
        r_basic = SalaryRule(
            structure_id=struct.id,
            name="Basic Salary",
            code="BASIC",
            category=RuleCategory.BASIC.value,
            sequence=10,
            computation_type=ComputationType.FIXED.value,
            fixed_amount=60000.0,
            appears_on_payslip=True,
            active=True,
        )
        r_hra = SalaryRule(
            structure_id=struct.id,
            name="House Rent Allowance",
            code="HRA",
            category=RuleCategory.ALLOWANCE.value,
            sequence=20,
            computation_type=ComputationType.PERCENTAGE.value,
            percentage_base_code="BASIC",
            percentage_rate=40.0,
            appears_on_payslip=True,
            active=True,
        )
        r_pf = SalaryRule(
            structure_id=struct.id,
            name="Provident Fund",
            code="PF",
            category=RuleCategory.DEDUCTION.value,
            sequence=30,
            computation_type=ComputationType.PERCENTAGE.value,
            percentage_base_code="BASIC",
            percentage_rate=12.0,
            appears_on_payslip=True,
            active=True,
        )
        db.add_all([r_basic, r_hra, r_pf])
        db.commit()

        # Employee 1
        emp1_email = f"emp1_{ts}@example.com"
        emp1 = Employee(
            employee_code=f"EMP_PDF_1_{ts}",
            name="Alice Smith",
            work_email=emp1_email,
            department="Engineering",
            job_position="Software Engineer",
            company="PeoplePay360 Inc.",
            status=EmployeeStatus.ACTIVE.value,
        )
        db.add(emp1)
        db.commit()
        db.refresh(emp1)

        u1 = User(
            email=emp1_email,
            username=f"emp1_{ts}",
            hashed_password=get_password_hash("emp123"),
            role=UserRole.EMPLOYEE.value,
            employee_id=emp1.id,
            is_active=True,
        )
        db.add(u1)
        db.commit()
        db.refresh(u1)

        # Employee 2 (for RBAC tests)
        emp2_email = f"emp2_{ts}@example.com"
        emp2 = Employee(
            employee_code=f"EMP_PDF_2_{ts}",
            name="Bob Jones",
            work_email=emp2_email,
            department="Design",
            job_position="UI Designer",
            company="PeoplePay360 Inc.",
            status=EmployeeStatus.ACTIVE.value,
        )
        db.add(emp2)
        db.commit()
        db.refresh(emp2)

        u2 = User(
            email=emp2_email,
            username=f"emp2_{ts}",
            hashed_password=get_password_hash("emp123"),
            role=UserRole.EMPLOYEE.value,
            employee_id=emp2.id,
            is_active=True,
        )
        db.add(u2)
        db.commit()
        db.refresh(u2)

        # Employee 3 (without valid email for missing recipient test)
        emp3 = Employee(
            employee_code=f"EMP_PDF_3_{ts}",
            name="NoEmail Worker",
            work_email=f"noemail_{ts}",
            department="Operations",
            job_position="Assistant",
            company="PeoplePay360 Inc.",
            status=EmployeeStatus.ACTIVE.value,
        )
        db.add(emp3)
        db.commit()
        db.refresh(emp3)

        # Contracts
        c1 = Contract(
            contract_code=f"CT_PDF1_{ts}",
            name=f"Contract Alice {ts}",
            employee_id=emp1.id,
            salary_structure_id=struct.id,
            wage_per_month=60000.0,
            start_date=date(2026, 4, 1),
            status=ContractStatus.RUNNING.value,
        )
        c2 = Contract(
            contract_code=f"CT_PDF2_{ts}",
            name=f"Contract Bob {ts}",
            employee_id=emp2.id,
            salary_structure_id=struct.id,
            wage_per_month=50000.0,
            start_date=date(2026, 4, 1),
            status=ContractStatus.RUNNING.value,
        )
        c3 = Contract(
            contract_code=f"CT_PDF3_{ts}",
            name=f"Contract NoEmail {ts}",
            employee_id=emp3.id,
            salary_structure_id=struct.id,
            wage_per_month=40000.0,
            start_date=date(2026, 4, 1),
            status=ContractStatus.RUNNING.value,
        )
        db.add_all([c1, c2, c3])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)
        db.refresh(c3)

        # Payrun
        payrun = Payrun(
            name=f"Payrun PDF {ts}",
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 30),
            salary_structure_id=struct.id,
            status=PayrunStatus.FINALIZED.value,
        )
        db.add(payrun)
        db.commit()
        db.refresh(payrun)

        # Payslip 1 (Finalized) for Emp1
        ps1 = Payslip(
            payslip_number=f"PS-2026-PDF1-{ts}",
            employee_id=emp1.id,
            contract_id=c1.id,
            salary_structure_id=struct.id,
            payrun_id=payrun.id,
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 30),
            status=PayslipStatus.FINALIZED.value,
            basic_salary=60000.0,
            gross_salary=84000.0,
            net_salary=76800.0,
            total_earnings=84000.0,
            total_deductions=7200.0,
            worked_days=22.0,
            computed_at=datetime.utcnow(),
        )
        db.add(ps1)
        db.commit()
        db.refresh(ps1)

        # Payslip 1 lines
        line1 = PayslipLine(payslip_id=ps1.id, rule_name="Basic", rule_code="BASIC", category="Basic", amount=60000.0, total=60000.0, sequence=10)
        line2 = PayslipLine(payslip_id=ps1.id, rule_name="HRA", rule_code="HRA", category="Allowance", amount=24000.0, total=24000.0, sequence=20)
        line3 = PayslipLine(payslip_id=ps1.id, rule_name="PF", rule_code="PF", category="Deduction", amount=7200.0, total=7200.0, sequence=30)
        db.add_all([line1, line2, line3])
        db.commit()

        # Payslip 2 (Finalized) for Emp2
        ps2 = Payslip(
            payslip_number=f"PS-2026-PDF2-{ts}",
            employee_id=emp2.id,
            contract_id=c2.id,
            salary_structure_id=struct.id,
            payrun_id=payrun.id,
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 30),
            status=PayslipStatus.FINALIZED.value,
            basic_salary=50000.0,
            gross_salary=70000.0,
            net_salary=64000.0,
            total_earnings=70000.0,
            total_deductions=6000.0,
            worked_days=22.0,
            computed_at=datetime.utcnow(),
        )
        db.add(ps2)
        db.commit()
        db.refresh(ps2)
        l2_1 = PayslipLine(payslip_id=ps2.id, rule_name="Basic", rule_code="BASIC", category="Basic", amount=50000.0, total=50000.0, sequence=10)
        db.add(l2_1)
        db.commit()

        # Payslip 3 (Finalized) for Emp3 (No valid email)
        ps3 = Payslip(
            payslip_number=f"PS-2026-PDF3-{ts}",
            employee_id=emp3.id,
            contract_id=c3.id,
            salary_structure_id=struct.id,
            payrun_id=payrun.id,
            period_start=date(2026, 4, 1),
            period_end=date(2026, 4, 30),
            status=PayslipStatus.FINALIZED.value,
            basic_salary=40000.0,
            gross_salary=40000.0,
            net_salary=40000.0,
            total_earnings=40000.0,
            total_deductions=0.0,
            worked_days=22.0,
            computed_at=datetime.utcnow(),
        )
        db.add(ps3)
        db.commit()
        db.refresh(ps3)

        # Payslip 4 (Draft/Uncomputed)
        ps_draft = Payslip(
            payslip_number=f"PS-2026-PDF4-{ts}",
            employee_id=emp1.id,
            contract_id=c1.id,
            salary_structure_id=struct.id,
            period_start=date(2026, 5, 1),
            period_end=date(2026, 5, 31),
            status=PayslipStatus.DRAFT.value,
        )
        db.add(ps_draft)
        db.commit()
        db.refresh(ps_draft)

        yield {
            "admin_headers": get_auth_headers("admin@peoplepay360.com", "admin123"),
            "emp1_headers": get_auth_headers(emp1_email, "emp123"),
            "emp2_headers": get_auth_headers(emp2_email, "emp123"),
            "emp1": emp1,
            "emp2": emp2,
            "emp3": emp3,
            "ps1": ps1,
            "ps2": ps2,
            "ps3": ps3,
            "ps_draft": ps_draft,
            "payrun": payrun,
        }
    finally:
        db.close()


def test_generate_pdf_success(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    ps1 = setup_pdf_email_data["ps1"]

    response = client.post(f"/api/v1/payroll/payslips/{ps1.id}/generate-pdf", headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["payslip_id"] == ps1.id
    assert data["mime_type"] == "application/pdf"
    assert data["file_size"] > 0
    assert data["file_name"].endswith(".pdf")

    # Check database model
    db = SessionLocal()
    payslip_in_db = db.query(Payslip).filter(Payslip.id == ps1.id).first()
    assert payslip_in_db.pdf_path is not None

    doc = db.query(PayslipDocument).filter(PayslipDocument.payslip_id == ps1.id).first()
    assert doc is not None
    assert doc.mime_type == "application/pdf"
    assert doc.file_size > 0
    assert doc.file_name.endswith(".pdf")
    db.close()


def test_generate_pdf_uncomputed_fails(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    ps_draft = setup_pdf_email_data["ps_draft"]

    response = client.post(f"/api/v1/payroll/payslips/{ps_draft.id}/generate-pdf", headers=headers)
    assert response.status_code == 400
    assert "draft" in response.json()["detail"].lower() or "uncomputed" in response.json()["detail"].lower()


def test_download_pdf_success(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    ps1 = setup_pdf_email_data["ps1"]

    # Test download as attachment
    response = client.get(f"/api/v1/payroll/payslips/{ps1.id}/pdf?download=true", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")
    assert "attachment;" in response.headers.get("content-disposition", "")

    # Test preview (inline)
    response_inline = client.get(f"/api/v1/payroll/payslips/{ps1.id}/pdf", headers=headers)
    assert response_inline.status_code == 200
    assert response_inline.headers["content-type"] == "application/pdf"
    assert "inline;" in response_inline.headers.get("content-disposition", "")


def test_download_pdf_rbac(setup_pdf_email_data):
    emp1_headers = setup_pdf_email_data["emp1_headers"]
    emp2_headers = setup_pdf_email_data["emp2_headers"]
    ps1 = setup_pdf_email_data["ps1"]
    ps2 = setup_pdf_email_data["ps2"]

    # Emp1 can download own payslip ps1
    res1 = client.get(f"/api/v1/payroll/payslips/{ps1.id}/pdf", headers=emp1_headers)
    assert res1.status_code == 200
    assert res1.content.startswith(b"%PDF-")

    # Emp1 CANNOT download Emp2's payslip ps2 -> 403 Forbidden
    res_forbidden = client.get(f"/api/v1/payroll/payslips/{ps2.id}/pdf", headers=emp1_headers)
    assert res_forbidden.status_code == 403

    # Emp2 can download ps2
    res2 = client.get(f"/api/v1/payroll/payslips/{ps2.id}/pdf", headers=emp2_headers)
    assert res2.status_code == 200


def test_send_email_success(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    ps1 = setup_pdf_email_data["ps1"]

    response = client.post(
        f"/api/v1/payroll/payslips/{ps1.id}/email",
        json={"subject": "Your April 2026 Payslip", "custom_message": "Please find attached your payslip."},
        headers=headers
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] in ["SENT", "SIMULATED"]
    assert data["recipient_email"] == ps1.employee.work_email

    # Verify payslip email status
    db = SessionLocal()
    ps = db.query(Payslip).filter(Payslip.id == ps1.id).first()
    assert ps.email_sent is True
    assert ps.email_sent_at is not None

    # Verify log entry
    logs = db.query(PayslipEmailLog).filter(PayslipEmailLog.payslip_id == ps1.id).all()
    assert len(logs) >= 1
    assert logs[-1].recipient_email == ps1.employee.work_email
    db.close()


def test_send_email_missing_recipient(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    ps3 = setup_pdf_email_data["ps3"]

    response = client.post(
        f"/api/v1/payroll/payslips/{ps3.id}/email",
        json={},
        headers=headers
    )
    assert response.status_code == 400
    assert "no valid email address" in response.json()["detail"].lower()

    # Verify log entry created with FAILED
    db = SessionLocal()
    logs = db.query(PayslipEmailLog).filter(PayslipEmailLog.payslip_id == ps3.id).all()
    assert len(logs) >= 1
    assert logs[-1].status == "FAILED"
    db.close()


def test_resend_email(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    ps1 = setup_pdf_email_data["ps1"]

    response = client.post(
        f"/api/v1/payroll/payslips/{ps1.id}/resend-email",
        headers=headers
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] in ["SENT", "SIMULATED"]
    assert data["recipient_email"] == ps1.employee.work_email

    # Verify email history endpoint
    hist_res = client.get(f"/api/v1/payroll/payslips/{ps1.id}/email-history", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 2
    assert history[0]["payslip_id"] == ps1.id


def test_bulk_email_payrun(setup_pdf_email_data):
    headers = setup_pdf_email_data["admin_headers"]
    payrun = setup_pdf_email_data["payrun"]

    response = client.post(
        f"/api/v1/payroll/payruns/{payrun.id}/send-all-payslips",
        headers=headers
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["total_payslips"] >= 3
    assert data["sent_count"] >= 2  # ps1 and ps2 have valid emails
    assert data["failed_count"] >= 1  # ps3 has invalid email
    assert len(data["details"]) >= 3
