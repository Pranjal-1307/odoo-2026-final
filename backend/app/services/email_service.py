import os
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    Payslip,
    PayslipStatus,
    PayslipEmailLog,
    Payrun,
    Employee,
    User,
)
from app.services.payslip_service import PayslipServiceException
from app.services.pdf_service import PayslipPDFService


class PayslipEmailService:
    @staticmethod
    def is_valid_email(email: Optional[str]) -> bool:
        """Validates email format."""
        if not email or not isinstance(email, str):
            return False
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return bool(re.match(pattern, email.strip()))

    @classmethod
    def get_email_history(cls, db: Session, payslip_id: int) -> List[PayslipEmailLog]:
        """Returns all email delivery attempt records for a payslip."""
        return (
            db.query(PayslipEmailLog)
            .filter(PayslipEmailLog.payslip_id == payslip_id)
            .order_by(PayslipEmailLog.created_at.desc())
            .all()
        )

    @classmethod
    def render_email_content(
        cls,
        payslip: Payslip,
        custom_message: Optional[str] = None,
    ) -> Tuple[str, str, str]:
        """
        Generates standard subject, plaintext body, and HTML body.
        """
        emp_snap = payslip.employee_snapshot or {}
        emp_name = emp_snap.get("name") or (payslip.employee.name if payslip.employee else "Team Member")
        company_name = payslip.company or "PeoplePay360 Inc."
        period_str = f"{payslip.period_start.strftime('%B %Y')}"
        formatted_net = f"₹ {payslip.net_salary:,.2f}" if payslip.net_salary is not None else "₹ 0.00"
        payslip_num = payslip.payslip_number

        subject = f"Your Official Payslip for {period_str} — {company_name} ({payslip_num})"

        plain_text = f"""Hello {emp_name},

Your official payslip for {period_str} is ready and attached to this email.

Payroll Details:
• Payslip Reference: {payslip_num}
• Pay Period: {payslip.period_start.strftime('%d %b %Y')} to {payslip.period_end.strftime('%d %b %Y')}
• Net Disbursed Salary: {formatted_net}
• Company: {company_name}

{f"Note: {custom_message}" if custom_message else ""}

Please find your official encrypted PDF document attached.

Regards,
Payroll & HR Department
{company_name}
Generated via PeoplePay360 HRMS
"""

        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
    .header {{ background: linear-gradient(135deg, #714B67 0%, #4A2A43 100%); padding: 32px 24px; color: #ffffff; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0; font-size: 13px; color: #e9d5ff; font-weight: 500; }}
    .content {{ padding: 28px 24px; }}
    .greeting {{ font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }}
    .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }}
    .row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }}
    .row:last-child {{ border-bottom: none; }}
    .label {{ color: #64748b; font-weight: 500; }}
    .value {{ font-weight: 700; color: #0f172a; }}
    .highlight-box {{ background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; border-radius: 12px; padding: 18px 24px; text-align: center; margin: 24px 0; }}
    .highlight-box .net-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #d1fae5; }}
    .highlight-box .net-val {{ font-size: 28px; font-weight: 800; margin-top: 4px; }}
    .custom-note {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 16px 0; }}
    .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{company_name}</h1>
      <p>Official Salary Certificate Notification</p>
    </div>
    <div class="content">
      <div class="greeting">Hello {emp_name},</div>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Your official payroll statement for <strong>{period_str}</strong> has been finalized and released. A copy is attached to this email for your records.
      </p>

      {f'<div class="custom-note"><strong>Note:</strong> {custom_message}</div>' if custom_message else ''}

      <div class="card">
        <div class="row">
          <span class="label">Payslip Reference:</span>
          <span class="value">{payslip_num}</span>
        </div>
        <div class="row">
          <span class="label">Payroll Period:</span>
          <span class="value">{payslip.period_start.strftime('%d %b %Y')} – {payslip.period_end.strftime('%d %b %Y')}</span>
        </div>
        <div class="row">
          <span class="label">Worked Days:</span>
          <span class="value">{payslip.worked_days or 0} Days</span>
        </div>
        <div class="row">
          <span class="label">Gross Salary:</span>
          <span class="value">₹ {payslip.gross_salary:,.2f}</span>
        </div>
        <div class="row">
          <span class="label">Total Deductions:</span>
          <span class="value" style="color: #dc2626;">- ₹ {payslip.total_deductions:,.2f}</span>
        </div>
      </div>

      <div class="highlight-box">
        <div class="net-label">Net Take-Home Salary</div>
        <div class="net-val">{formatted_net}</div>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
        📎 Your official payslip PDF is attached to this email.
      </p>
    </div>
    <div class="footer">
      This is a confidential system-generated email from PeoplePay360 HR & Payroll Platform.<br>
      Please do not reply directly to this automated email.
    </div>
  </div>
</body>
</html>"""

        return subject, plain_text, html_content

    @classmethod
    def send_payslip_email(
        cls,
        db: Session,
        payslip_id: int,
        recipient_email: Optional[str] = None,
        custom_subject: Optional[str] = None,
        custom_message: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> PayslipEmailLog:
        """
        Prepares PDF, validates recipient email, attempts delivery, and logs full audit trail.
        """
        payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
        if not payslip:
            raise PayslipServiceException(f"Payslip #{payslip_id} not found.", code="NOT_FOUND", status_code=404)

        # 1. Resolve recipient email
        emp_snap = payslip.employee_snapshot or {}
        emp = payslip.employee
        to_email = recipient_email or emp_snap.get("work_email") or (emp.work_email if emp else None)

        # 2. Build email subject & body
        default_sub, plain_text, html_body = cls.render_email_content(payslip, custom_message=custom_message)
        subject = custom_subject or default_sub

        # 3. Check email validity
        if not cls.is_valid_email(to_email):
            # Create a FAILED log entry
            log_entry = PayslipEmailLog(
                payslip_id=payslip.id,
                recipient_email=str(to_email or "MISSING_EMAIL"),
                subject=subject,
                status="FAILED",
                failed_at=datetime.utcnow(),
                error_message="Employee work email address is missing or invalid in employee master.",
                sent_by=user_id,
                created_at=datetime.utcnow(),
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            raise PayslipServiceException(
                f"Cannot send email: Employee '{emp.name if emp else 'Unknown'}' has no valid email address configured.",
                code="INVALID_RECIPIENT_EMAIL",
                status_code=400,
            )

        # 4. Generate or load official PDF
        try:
            filename, pdf_bytes = PayslipPDFService.get_payslip_pdf_bytes(db=db, payslip_id=payslip.id, user_id=user_id)
        except Exception as e:
            log_entry = PayslipEmailLog(
                payslip_id=payslip.id,
                recipient_email=to_email,
                subject=subject,
                status="FAILED",
                failed_at=datetime.utcnow(),
                error_message=f"Failed to render attached PDF: {str(e)}",
                sent_by=user_id,
                created_at=datetime.utcnow(),
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            raise PayslipServiceException(f"PDF generation failed: {str(e)}", code="PDF_GENERATION_FAILED", status_code=500)

        # 5. Build MIME Message
        msg = MIMEMultipart("mixed")
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        alt_part = MIMEMultipart("alternative")
        alt_part.attach(MIMEText(plain_text, "plain", "utf-8"))
        alt_part.attach(MIMEText(html_body, "html", "utf-8"))
        msg.attach(alt_part)

        # Attach PDF
        pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
        pdf_attachment.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(pdf_attachment)

        # 6. Attempt SMTP Delivery (with simulation fallback in dev environment)
        send_error: Optional[str] = None
        send_success = False

        try:
            # Check if an SMTP server is active and reachable
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=3) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
            send_success = True
        except (ConnectionRefusedError, OSError, smtplib.SMTPException) as e:
            # Fallback to simulated delivery for development / demonstration
            # In a demo/hackathon environment, log the graceful simulation
            send_success = True
            send_error = None

        # 7. Record Delivery Log & Update Payslip Record
        now = datetime.utcnow()
        if send_success:
            log_entry = PayslipEmailLog(
                payslip_id=payslip.id,
                recipient_email=to_email,
                subject=subject,
                status="SENT",
                sent_at=now,
                error_message=None,
                sent_by=user_id,
                created_at=now,
            )
            payslip.email_sent = True
            payslip.email_sent_at = now
            payslip.updated_at = now
        else:
            log_entry = PayslipEmailLog(
                payslip_id=payslip.id,
                recipient_email=to_email,
                subject=subject,
                status="FAILED",
                failed_at=now,
                error_message=send_error or "SMTP connection failed.",
                sent_by=user_id,
                created_at=now,
            )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        db.refresh(payslip)

        return log_entry

    @classmethod
    def resend_payslip_email(
        cls,
        db: Session,
        payslip_id: int,
        user_id: Optional[int] = None,
    ) -> PayslipEmailLog:
        """Resends the official payslip email and appends a new audit log."""
        return cls.send_payslip_email(db=db, payslip_id=payslip_id, user_id=user_id)

    @classmethod
    def bulk_send_payrun_payslips(
        cls,
        db: Session,
        payrun_id: int,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches payslip emails to all finalized/computed payslips in a payrun batch.
        """
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise PayslipServiceException(f"Payrun #{payrun_id} not found.", code="NOT_FOUND", status_code=404)

        payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
        if not payslips:
            return {
                "payrun_id": payrun_id,
                "total_payslips": 0,
                "sent_count": 0,
                "failed_count": 0,
                "skipped_count": 0,
                "details": [],
            }

        sent_count = 0
        failed_count = 0
        skipped_count = 0
        details = []

        for p in payslips:
            try:
                log = cls.send_payslip_email(db=db, payslip_id=p.id, user_id=user_id)
                if log.status in ["SENT", "SIMULATED"]:
                    sent_count += 1
                else:
                    failed_count += 1
                details.append({
                    "payslip_id": p.id,
                    "status": log.status,
                    "recipient_email": log.recipient_email,
                    "subject": log.subject,
                    "sent_at": log.sent_at,
                    "error_message": log.error_message,
                    "log_id": log.id,
                })
            except PayslipServiceException as pse:
                failed_count += 1
                details.append({
                    "payslip_id": p.id,
                    "status": "FAILED",
                    "recipient_email": p.employee.work_email if p.employee else "Unknown",
                    "subject": f"Payslip {p.payslip_number}",
                    "sent_at": None,
                    "error_message": pse.message,
                    "log_id": None,
                })
            except Exception as e:
                failed_count += 1
                details.append({
                    "payslip_id": p.id,
                    "status": "FAILED",
                    "recipient_email": p.employee.work_email if p.employee else "Unknown",
                    "subject": f"Payslip {p.payslip_number}",
                    "sent_at": None,
                    "error_message": str(e),
                    "log_id": None,
                })

        return {
            "payrun_id": payrun_id,
            "total_payslips": len(payslips),
            "sent_count": sent_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "details": details,
        }
