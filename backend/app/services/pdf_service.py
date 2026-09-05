import os
import io
from datetime import datetime, date
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

from app.models import (
    Payslip,
    PayslipDocument,
    PayslipStatus,
    Employee,
    Contract,
    SalaryStructure,
    User,
)
from app.services.payslip_service import PayslipServiceException


# Primary Brand Colors (Odoo Purple & Professional Palettes)
COLOR_PRIMARY = colors.HexColor("#714B67")      # Odoo Purple
COLOR_PRIMARY_DARK = colors.HexColor("#4A2A43") # Deep Purple
COLOR_SECONDARY = colors.HexColor("#017E84")    # Teal Accent
COLOR_SUCCESS = colors.HexColor("#059669")      # Emerald 600
COLOR_DANGER = colors.HexColor("#DC2626")       # Red 600
COLOR_WARNING = colors.HexColor("#D97706")      # Amber 600
COLOR_SLATE_DARK = colors.HexColor("#1E293B")   # Slate 800
COLOR_SLATE_MED = colors.HexColor("#475569")    # Slate 600
COLOR_SLATE_LIGHT = colors.HexColor("#64748B")  # Slate 500
COLOR_BG_LIGHT = colors.HexColor("#F8FAFC")     # Slate 50
COLOR_BG_ROW_ALT = colors.HexColor("#F1F5F9")   # Slate 100
COLOR_BORDER = colors.HexColor("#E2E8F0")       # Slate 200
COLOR_WHITE = colors.HexColor("#FFFFFF")
COLOR_CARD_BG = colors.HexColor("#F9FBFD")


class PayslipPDFService:
    STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "payslips")

    @classmethod
    def ensure_storage_dir(cls) -> str:
        """Ensures the payslip storage directory exists."""
        os.makedirs(cls.STORAGE_DIR, exist_ok=True)
        return cls.STORAGE_DIR

    @classmethod
    def get_standard_filename(cls, payslip: Payslip) -> str:
        """
        Generates standard sanitized filename:
        Payslip_{PayslipNumber}_{EmployeeCode}_{Period}.pdf
        """
        emp_code = "EMP"
        if payslip.employee_snapshot and payslip.employee_snapshot.get("employee_code"):
            emp_code = str(payslip.employee_snapshot["employee_code"]).replace("/", "-")
        elif payslip.employee:
            emp_code = str(payslip.employee.employee_code).replace("/", "-")
            
        clean_num = str(payslip.payslip_number).replace("/", "-").replace(" ", "_")
        period_str = payslip.period_start.strftime("%Y-%m")
        return f"Payslip_{clean_num}_{emp_code}_{period_str}.pdf"

    @classmethod
    def format_currency(cls, amount: Optional[float]) -> str:
        """Formats amount with Indian Rupee representation."""
        val = amount or 0.0
        return f"₹ {val:,.2f}"

    @classmethod
    def generate_payslip_pdf(
        cls,
        db: Session,
        payslip_id: int,
        user_id: Optional[int] = None,
        force_regenerate: bool = False,
    ) -> Tuple[str, bytes, PayslipDocument]:
        """
        Generates official PDF document for a finalized payslip, saves to filesystem,
        and registers / updates a PayslipDocument record.
        """
        payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
        if not payslip:
            raise PayslipServiceException(f"Payslip #{payslip_id} not found.", code="NOT_FOUND", status_code=404)

        # Ensure payslip is finalized or validated
        is_finalized = payslip.status in [
            PayslipStatus.FINALIZED.value,
            PayslipStatus.VALIDATED.value,
            PayslipStatus.PAID.value,
        ]
        if not is_finalized and payslip.status != PayslipStatus.COMPUTED.value:
            raise PayslipServiceException(
                f"Official PDF cannot be generated for payslip in '{payslip.status}' status. Only computed or finalized payslips can produce documents.",
                code="PAYSLIP_NOT_ELIGIBLE",
                status_code=400,
            )

        storage_dir = cls.ensure_storage_dir()
        filename = cls.get_standard_filename(payslip)
        filepath = os.path.join(storage_dir, filename)

        # Check if existing document file is already cached and not force_regenerate
        if not force_regenerate and os.path.exists(filepath):
            doc_record = db.query(PayslipDocument).filter(
                PayslipDocument.payslip_id == payslip.id,
                PayslipDocument.file_name == filename,
            ).first()
            if doc_record:
                with open(filepath, "rb") as f:
                    pdf_bytes = f.read()
                return filepath, pdf_bytes, doc_record

        # Build PDF Bytes
        pdf_bytes = cls._build_pdf_binary(payslip)

        # Save to disk
        with open(filepath, "wb") as f:
            f.write(pdf_bytes)

        # Register or update PayslipDocument in database
        doc_record = db.query(PayslipDocument).filter(
            PayslipDocument.payslip_id == payslip.id,
            PayslipDocument.document_type == "PAYSLIP_PDF",
        ).first()

        if not doc_record:
            doc_record = PayslipDocument(
                payslip_id=payslip.id,
                document_type="PAYSLIP_PDF",
                file_name=filename,
                file_path=filepath,
                mime_type="application/pdf",
                file_size=len(pdf_bytes),
                generated_at=datetime.utcnow(),
                generated_by=user_id,
                created_at=datetime.utcnow(),
            )
            db.add(doc_record)
        else:
            doc_record.file_name = filename
            doc_record.file_path = filepath
            doc_record.file_size = len(pdf_bytes)
            doc_record.generated_at = datetime.utcnow()
            doc_record.generated_by = user_id

        # Update payslip's pdf_path attribute
        payslip.pdf_path = filepath
        payslip.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(doc_record)
        db.refresh(payslip)

        return filepath, pdf_bytes, doc_record

    @classmethod
    def get_payslip_pdf_bytes(
        cls,
        db: Session,
        payslip_id: int,
        user_id: Optional[int] = None,
    ) -> Tuple[str, bytes]:
        """
        Retrieves existing PDF or generates it on the fly.
        """
        filepath, pdf_bytes, _ = cls.generate_payslip_pdf(db=db, payslip_id=payslip_id, user_id=user_id, force_regenerate=False)
        filename = os.path.basename(filepath)
        return filename, pdf_bytes

    @classmethod
    def _build_pdf_binary(cls, payslip: Payslip) -> bytes:
        """
        Constructs the ReportLab Document and returns raw bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=14 * mm,
            rightMargin=14 * mm,
            topMargin=12 * mm,
            bottomMargin=12 * mm,
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        style_company_title = ParagraphStyle(
            "CompanyTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=COLOR_WHITE,
        )
        style_company_sub = ParagraphStyle(
            "CompanySub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=COLOR_WHITE,
        )
        style_doc_title = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=COLOR_WHITE,
            alignment=TA_RIGHT,
        )
        style_doc_sub = ParagraphStyle(
            "DocSub",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#E9D5FF"),
            alignment=TA_RIGHT,
        )
        style_meta_label = ParagraphStyle(
            "MetaLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=COLOR_SLATE_LIGHT,
        )
        style_meta_val = ParagraphStyle(
            "MetaValue",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=COLOR_SLATE_DARK,
        )
        style_table_header = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_SLATE_DARK,
        )
        style_table_cell = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=COLOR_SLATE_DARK,
        )
        style_table_cell_code = ParagraphStyle(
            "TableCellCode",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=10,
            textColor=COLOR_PRIMARY,
        )
        style_table_cell_num = ParagraphStyle(
            "TableCellNum",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=COLOR_SLATE_DARK,
            alignment=TA_RIGHT,
        )
        style_net_title = ParagraphStyle(
            "NetTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=COLOR_WHITE,
        )
        style_net_sub = ParagraphStyle(
            "NetSub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#D1FAE5"),
        )
        style_net_amount = ParagraphStyle(
            "NetAmount",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=COLOR_WHITE,
            alignment=TA_RIGHT,
        )
        style_footer = ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=COLOR_SLATE_LIGHT,
            alignment=TA_CENTER,
        )

        story = []
        page_width = A4[0] - 28 * mm  # total printable width = ~182mm

        # -------------------------------------------------------------
        # 1. HEADER BANNER (Branded Purple)
        # -------------------------------------------------------------
        company_name = payslip.company or "PeoplePay360 Inc."
        period_str = f"{payslip.period_start.strftime('%d %b %Y')} – {payslip.period_end.strftime('%d %b %Y')}"
        month_year_str = payslip.period_start.strftime("%B %Y")

        left_header = [
            Paragraph(company_name, style_company_title),
            Spacer(1, 1 * mm),
            Paragraph("Comprehensive HR & Payroll Management System", style_company_sub),
            Paragraph("Email: hr@peoplepay360.com • Web: https://peoplepay360.internal", style_company_sub),
        ]
        right_header = [
            Paragraph("SALARY PAYSLIP", style_doc_title),
            Spacer(1, 1 * mm),
            Paragraph(f"Period: {month_year_str}", style_doc_sub),
            Paragraph(f"Ref: {payslip.payslip_number}", style_doc_sub),
        ]

        header_table = Table(
            [[left_header, right_header]],
            colWidths=[page_width * 0.58, page_width * 0.42],
        )
        header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_PRIMARY),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 4 * mm))

        # -------------------------------------------------------------
        # 2. EMPLOYEE & PAYROLL DETAILS (2-Column Card)
        # -------------------------------------------------------------
        emp_snap = payslip.employee_snapshot or {}
        contract_snap = payslip.contract_snapshot or {}
        emp_name = emp_snap.get("name") or (payslip.employee.name if payslip.employee else "Employee")
        emp_code = emp_snap.get("employee_code") or (payslip.employee.employee_code if payslip.employee else "EMP001")
        emp_dept = emp_snap.get("department") or (payslip.employee.department if payslip.employee else "General")
        emp_job = emp_snap.get("job_position") or (payslip.employee.job_position if payslip.employee else "Staff")
        bank_name = emp_snap.get("bank_name") or "HDFC Bank"
        acc_no = emp_snap.get("bank_account_no") or "••••••••5678"
        if len(acc_no) > 4 and not acc_no.startswith("•"):
            acc_no = f"••••{acc_no[-4:]}"
        pan_no = emp_snap.get("pan_no") or "ABCDE1234F"
        struct_name = payslip.salary_structure.name if payslip.salary_structure else (contract_snap.get("structure_name") or "Standard Monthly")

        col_w = (page_width - 4 * mm) / 2
        
        emp_info_data = [
            [Paragraph("EMPLOYEE INFORMATION", ParagraphStyle("H1", parent=style_meta_label, textColor=COLOR_PRIMARY)), ""],
            [Paragraph("Employee Name:", style_meta_label), Paragraph(emp_name, style_meta_val)],
            [Paragraph("Employee Code:", style_meta_label), Paragraph(emp_code, style_meta_val)],
            [Paragraph("Department:", style_meta_label), Paragraph(emp_dept, style_meta_val)],
            [Paragraph("Job Position:", style_meta_label), Paragraph(emp_job, style_meta_val)],
            [Paragraph("PAN / Tax ID:", style_meta_label), Paragraph(pan_no, style_meta_val)],
        ]
        payroll_info_data = [
            [Paragraph("PAYROLL & BANK DETAILS", ParagraphStyle("H2", parent=style_meta_label, textColor=COLOR_PRIMARY)), ""],
            [Paragraph("Payslip Number:", style_meta_label), Paragraph(payslip.payslip_number, style_meta_val)],
            [Paragraph("Pay Period:", style_meta_label), Paragraph(period_str, style_meta_val)],
            [Paragraph("Structure:", style_meta_label), Paragraph(struct_name, style_meta_val)],
            [Paragraph("Bank & A/C:", style_meta_label), Paragraph(f"{bank_name} ({acc_no})", style_meta_val)],
            [Paragraph("Status:", style_meta_label), Paragraph(payslip.status.upper(), ParagraphStyle("Stat", parent=style_meta_val, textColor=COLOR_SUCCESS if payslip.status == 'finalized' else COLOR_PRIMARY))],
        ]

        t_emp = Table(emp_info_data, colWidths=[col_w * 0.4, col_w * 0.6])
        t_emp.setStyle(TableStyle([
            ("SPAN", (0, 0), (1, 0)),
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_BG_LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_PRIMARY),
        ]))

        t_pay = Table(payroll_info_data, colWidths=[col_w * 0.4, col_w * 0.6])
        t_pay.setStyle(TableStyle([
            ("SPAN", (0, 0), (1, 0)),
            ("BACKGROUND", (0, 0), (-1, 0), COLOR_BG_LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_PRIMARY),
        ]))

        metadata_container = Table([[t_emp, t_pay]], colWidths=[col_w, col_w])
        metadata_container.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(metadata_container)
        story.append(Spacer(1, 3 * mm))

        # -------------------------------------------------------------
        # 3. ATTENDANCE & LEAVE METRICS BAR
        # -------------------------------------------------------------
        att_snap = payslip.attendance_snapshot or {}
        time_off_snap = payslip.time_off_snapshot or {}
        worked_days = payslip.worked_days or att_snap.get("worked_days", 0.0)
        scheduled_days = att_snap.get("scheduled_days", 22)
        paid_leave = time_off_snap.get("paid_leave_days", 0.0)
        unpaid_leave = payslip.unpaid_leave_days or time_off_snap.get("unpaid_leave_days", 0.0)
        overtime_hrs = att_snap.get("overtime_hours", 0.0)

        att_data = [
            [
                Paragraph("<b>Worked Days:</b>", style_table_cell), Paragraph(f"{worked_days}", style_table_cell_num),
                Paragraph("<b>Scheduled Days:</b>", style_table_cell), Paragraph(f"{scheduled_days}", style_table_cell_num),
                Paragraph("<b>Paid Leaves:</b>", style_table_cell), Paragraph(f"{paid_leave}", style_table_cell_num),
                Paragraph("<b>Unpaid Days:</b>", style_table_cell), Paragraph(f"{unpaid_leave}", style_table_cell_num),
                Paragraph("<b>Overtime (Hrs):</b>", style_table_cell), Paragraph(f"{overtime_hrs}", style_table_cell_num),
            ]
        ]
        w_item = page_width / 10
        att_table = Table(att_data, colWidths=[w_item] * 10)
        att_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_BG_LIGHT),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(att_table)
        story.append(Spacer(1, 4 * mm))

        # -------------------------------------------------------------
        # 4. SALARY BREAKDOWN: EARNINGS & DEDUCTIONS TABLES
        # -------------------------------------------------------------
        lines = payslip.lines or []
        earnings_lines = [
            l for l in lines
            if not l.is_employer_contribution and l.category in ["Basic", "Allowance", "Gross", "Earning", "EARNING"]
        ]
        deduction_lines = [
            l for l in lines
            if not l.is_employer_contribution and l.category in ["Deduction", "DEDUCTION", "Tax"]
        ]
        employer_lines = [
            l for l in lines
            if l.is_employer_contribution or l.category in ["Employer Contribution"]
        ]

        # Earnings Table Data
        earn_rows = [
            [Paragraph("EARNINGS", ParagraphStyle("EarnH", parent=style_table_header, textColor=COLOR_SUCCESS)), Paragraph("CODE", style_table_header), Paragraph("AMOUNT", style_table_header)],
        ]
        if not earnings_lines:
            earn_rows.append([Paragraph("Basic Salary", style_table_cell), Paragraph("BASIC", style_table_cell_code), Paragraph(cls.format_currency(payslip.basic_salary), style_table_cell_num)])
        else:
            for el in earnings_lines:
                earn_rows.append([
                    Paragraph(el.rule_name, style_table_cell),
                    Paragraph(el.rule_code, style_table_cell_code),
                    Paragraph(cls.format_currency(el.amount), style_table_cell_num),
                ])
        # Total Earnings Subtotal
        earn_rows.append([
            Paragraph("<b>GROSS EARNINGS (A)</b>", ParagraphStyle("GE", parent=style_table_header, textColor=COLOR_SUCCESS)),
            "",
            Paragraph(f"<b>{cls.format_currency(payslip.gross_salary)}</b>", ParagraphStyle("GENum", parent=style_table_cell_num, textColor=COLOR_SUCCESS)),
        ])

        # Deductions Table Data
        deduct_rows = [
            [Paragraph("DEDUCTIONS", ParagraphStyle("DedH", parent=style_table_header, textColor=COLOR_DANGER)), Paragraph("CODE", style_table_header), Paragraph("AMOUNT", style_table_header)],
        ]
        if not deduction_lines:
            deduct_rows.append([Paragraph("No statutory deductions", style_table_cell), Paragraph("—", style_table_cell_code), Paragraph(cls.format_currency(0.0), style_table_cell_num)])
        else:
            for dl in deduction_lines:
                deduct_rows.append([
                    Paragraph(dl.rule_name, style_table_cell),
                    Paragraph(dl.rule_code, style_table_cell_code),
                    Paragraph(cls.format_currency(dl.amount), style_table_cell_num),
                ])
        # Total Deductions Subtotal
        deduct_rows.append([
            Paragraph("<b>TOTAL DEDUCTIONS (B)</b>", ParagraphStyle("TD", parent=style_table_header, textColor=COLOR_DANGER)),
            "",
            Paragraph(f"<b>{cls.format_currency(payslip.total_deductions)}</b>", ParagraphStyle("TDNum", parent=style_table_cell_num, textColor=COLOR_DANGER)),
        ])

        tbl_earn = Table(earn_rows, colWidths=[col_w * 0.55, col_w * 0.20, col_w * 0.25])
        tbl_earn.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFDF5")),
            ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_SUCCESS),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ECFDF5")),
            ("LINEABOVE", (0, -1), (-1, -1), 1, COLOR_SUCCESS),
            ("SPAN", (0, -1), (1, -1)),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ]))

        tbl_deduct = Table(deduct_rows, colWidths=[col_w * 0.55, col_w * 0.20, col_w * 0.25])
        tbl_deduct.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FEF2F2")),
            ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_DANGER),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#FEF2F2")),
            ("LINEABOVE", (0, -1), (-1, -1), 1, COLOR_DANGER),
            ("SPAN", (0, -1), (1, -1)),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ]))

        breakdown_table = Table([[tbl_earn, tbl_deduct]], colWidths=[col_w, col_w])
        breakdown_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(breakdown_table)
        story.append(Spacer(1, 4 * mm))

        # -------------------------------------------------------------
        # 5. NET SALARY TAKE HOME HIGHLIGHT BANNER
        # -------------------------------------------------------------
        net_text = [
            Paragraph("NET TAKE-HOME SALARY (A − B)", style_net_title),
            Spacer(1, 1 * mm),
            Paragraph(f"Disbursed via Direct Bank Transfer • {bank_name} ({acc_no})", style_net_sub),
        ]
        net_num = [
            Paragraph(cls.format_currency(payslip.net_salary), style_net_amount),
            Paragraph("Official Disbursed Amount", ParagraphStyle("SubR", parent=style_net_sub, alignment=TA_RIGHT)),
        ]
        net_table = Table([[net_text, net_num]], colWidths=[page_width * 0.55, page_width * 0.45])
        net_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), COLOR_SUCCESS),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(net_table)
        story.append(Spacer(1, 4 * mm))

        # -------------------------------------------------------------
        # 6. EMPLOYER CONTRIBUTIONS & CTC SUMMARY
        # -------------------------------------------------------------
        if employer_lines:
            emp_contrib_rows = [
                [
                    Paragraph("EMPLOYER CONTRIBUTIONS (Cost to Company)", ParagraphStyle("EC", parent=style_table_header, textColor=COLOR_PRIMARY)),
                    Paragraph("CODE", style_table_header),
                    Paragraph("AMOUNT", style_table_header),
                ]
            ]
            for emp_l in employer_lines:
                emp_contrib_rows.append([
                    Paragraph(emp_l.rule_name, style_table_cell),
                    Paragraph(emp_l.rule_code, style_table_cell_code),
                    Paragraph(cls.format_currency(emp_l.amount), style_table_cell_num),
                ])
            emp_contrib_rows.append([
                Paragraph("<b>TOTAL EMPLOYER COST (CTC)</b>", ParagraphStyle("TCTC", parent=style_table_header, textColor=COLOR_PRIMARY)),
                "",
                Paragraph(f"<b>{cls.format_currency(payslip.total_employer_cost or ((payslip.gross_salary or 0) + (payslip.total_employer_contributions or 0)))}</b>", ParagraphStyle("TCTCNum", parent=style_table_cell_num, textColor=COLOR_PRIMARY)),
            ])
            t_contrib = Table(emp_contrib_rows, colWidths=[page_width * 0.55, page_width * 0.20, page_width * 0.25])
            t_contrib.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_BG_LIGHT),
                ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_PRIMARY),
                ("BACKGROUND", (0, -1), (-1, -1), COLOR_BG_LIGHT),
                ("LINEABOVE", (0, -1), (-1, -1), 1, COLOR_PRIMARY),
                ("SPAN", (0, -1), (1, -1)),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ]))
            story.append(t_contrib)
            story.append(Spacer(1, 4 * mm))

        # -------------------------------------------------------------
        # 7. FOOTER AUDIT & VERIFICATION NOTICE
        # -------------------------------------------------------------
        gen_timestamp = datetime.utcnow().strftime("%d-%b-%Y %H:%M:%S UTC")
        footer_text = (
            f"This is a computer-generated official payroll certificate issued by {company_name}. "
            f"No signature is required. Generated on {gen_timestamp} via PeoplePay360."
        )
        story.append(Spacer(1, 2 * mm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceBefore=1, spaceAfter=2))
        story.append(Paragraph(footer_text, style_footer))

        # Build document
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes
