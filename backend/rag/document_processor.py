import uuid
import io
import re
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from models.database import Document, DocumentChunk

# Role access mapping
ROLE_ACCESS_MAP = {
    "employee": ["employee"],
    "manager": ["employee", "manager"],
    "hr_admin": ["employee", "manager", "hr_admin"],
    "legal_admin": ["employee", "manager", "legal_admin"],
    "finance_admin": ["employee", "manager", "finance_admin"],
    "it_admin": ["employee", "manager", "it_admin"],
    "admin": ["employee", "manager", "hr_admin", "legal_admin", "finance_admin", "it_admin", "admin"]
}

class DocumentProcessor:
    def __init__(self):
        self.chunk_size = 500
        self.chunk_overlap = 50

    def seed_demo_documents(self, db: Session):
        """Seed the system with demo enterprise documents."""
        # Only seed if db is empty
        if db.query(Document).first() is not None:
            return

        demo_docs = [
            {
                "department": "hr",
                "access_level": "employee",
                "filename": "HR_Leave_Policy.txt",
                "content": """
HR LEAVE POLICY - ACME Corporation

ANNUAL LEAVE
All full-time employees are entitled to 21 days of annual leave per calendar year.
Annual leave accrues at 1.75 days per month of employment.
Employees must submit leave requests at least 7 days in advance through the HR portal.
Unused leave of up to 10 days can be carried forward to the next year.
Leave encashment is available for up to 5 days per year.

SICK LEAVE
Employees are entitled to 12 days of sick leave per year.
Sick leave beyond 3 consecutive days requires a medical certificate.
Sick leave cannot be carried forward to the next year.

MATERNITY/PATERNITY LEAVE
Maternity leave: 26 weeks for the first two children, 12 weeks thereafter.
Paternity leave: 15 days within 6 months of childbirth.
Adoption leave: 12 weeks for legal adoption of a child under 3 months.

EMERGENCY LEAVE
2 days emergency leave per year for immediate family emergencies.
Emergency leave requires approval from the direct manager and HR.

UNPAID LEAVE
Employees may apply for unpaid leave for personal reasons.
Maximum 30 days unpaid leave per year, subject to manager approval.
"""
            },
            {
                "department": "hr",
                "access_level": "employee",
                "filename": "Employee_Code_of_Conduct.txt",
                "content": """
EMPLOYEE CODE OF CONDUCT - ACME Corporation

PROFESSIONIONAL BEHAVIOR
All employees must maintain professional conduct at all times.
Harassment, discrimination, or bullying of any kind is strictly prohibited.
Employees must respect confidentiality of company and client information.

ATTENDANCE AND PUNCTUALITY
Standard working hours are 9:00 AM to 6:00 PM, Monday to Friday.
Employees are expected to maintain 90% attendance per quarter.
Remote work is permitted up to 2 days per week with manager approval.
Late arrivals exceeding 15 minutes should be reported to the manager.

CONFLICT OF INTEREST
Employees must disclose any conflict of interest to HR immediately.
Employees may not work for direct competitors during employment.
External consulting requires written approval from the management.

DATA SECURITY
Employees must not share company passwords or access credentials.
Company data must not be stored on personal devices without IT approval.
Suspected data breaches must be reported to IT security immediately.

SOCIAL MEDIA POLICY
Employees must not post confidential company information on social media.
Employees may not make statements that could damage company reputation.
"""
            },
            {
                "department": "finance",
                "access_level": "employee",
                "filename": "Expense_Reimbursement_Policy.txt",
                "content": """
EXPENSE REIMBURSEMENT POLICY - ACME Corporation

ELIGIBLE EXPENSES
Travel expenses for official business travel are reimbursable.
Accommodation up to INR 5000 per night in metro cities, INR 3000 elsewhere.
Meal allowance: INR 500 per day for domestic travel, USD 50 for international.
Local conveyance by auto/cab up to INR 300 per trip is reimbursable.

SUBMISSION PROCESS
All expense claims must be submitted within 30 days of incurring the expense.
Original receipts or digital invoices are mandatory for all claims above INR 500.
Claims must be submitted through the Finance Portal with manager approval.
Approved claims are processed within 7 working days.

AIR TRAVEL POLICY
Economy class for all domestic travel.
Business class permitted for international travel exceeding 6 hours.
Flight bookings must be made through the approved travel desk.

MOBILE AND INTERNET ALLOWANCE
Monthly mobile allowance: INR 1000 for executives, INR 500 for employees.
Internet allowance for remote work: INR 800 per month.

NON-REIMBURSABLE EXPENSES
Personal entertainment, alcohol, and personal shopping are not reimbursable.
Traffic fines and penalties are not reimbursable.
"""
            },
            {
                "department": "it",
                "access_level": "employee",
                "filename": "IT_Support_SOP.txt",
                "content": """
IT SUPPORT STANDARD OPERATING PROCEDURES - ACME Corporation

RAISING A SUPPORT TICKET
All IT issues must be reported through the IT helpdesk portal at it.acme.com.
For urgent issues, call the IT hotline: 1800-IT-HELP (available 24/7).
Ticket priority levels: P1 (Critical), P2 (High), P3 (Medium), P4 (Low).

RESPONSE TIME SLAs
P1 Critical (system down): Response within 30 minutes, resolution within 4 hours.
P2 High (major functionality impacted): Response within 2 hours, resolution within 8 hours.
P3 Medium (minor functionality issues): Response within 4 hours, resolution within 24 hours.
P4 Low (general queries): Response within 1 business day, resolution within 3 days.

PASSWORD RESET PROCEDURE
Self-service password reset available at accounts.acme.com.
For locked accounts, contact IT helpdesk with employee ID.
Passwords must be at least 12 characters with uppercase, numbers, and special characters.
Passwords must be changed every 90 days.

SOFTWARE INSTALLATION
All software installations require IT department approval.
Submit a software request form at it.acme.com/software-request.
Licensed software list is available on the IT portal.
Unauthorized software installation may result in disciplinary action.

EQUIPMENT POLICY
New joiners receive laptop, mouse, keyboard, and headset on Day 1.
Equipment loss or damage must be reported to IT within 24 hours.
All company devices must be returned upon resignation or termination.
"""
            },
            {
                "department": "legal",
                "access_level": "manager",
                "filename": "NDA_Template_Guidelines.txt",
                "content": """
NON-DISCLOSURE AGREEMENT GUIDELINES - ACME Corporation Legal Department

PURPOSE
This document outlines guidelines for Non-Disclosure Agreements (NDAs) with clients, vendors, and partners.

STANDARD NDA TERMS
NDAs are valid for 3 years from the date of signing unless otherwise specified.
All confidential information shared during business discussions is covered.
Exceptions include publicly available information and independently developed information.

SIGNING AUTHORITY
NDAs below INR 10 Lakhs: Department Manager can sign.
NDAs between INR 10 Lakhs to INR 1 Crore: VP or Director level required.
NDAs above INR 1 Crore: C-suite executive signature required.

NDA PROCESS
Draft NDA using the approved template from the Legal portal.
Submit for legal review at least 5 business days before signing deadline.
All executed NDAs must be filed in the Legal Document Management System.

VIOLATION CONSEQUENCES
Breach of NDA may result in immediate termination and legal action.
Employees must report suspected NDA breaches to the Legal team within 24 hours.
"""
            },
        ]

        for doc in demo_docs:
            content = doc["content"].strip()
            chunks = self._split_into_chunks(content)

            # Look up admin user to assign as uploader if needed, or leave null for system
            db_doc = Document(
                filename=doc["filename"],
                department=doc["department"],
                access_level=doc["access_level"],
                chunks_count=len(chunks)
            )
            db.add(db_doc)
            db.commit()
            db.refresh(db_doc)

            for i, chunk in enumerate(chunks):
                db_chunk = DocumentChunk(
                    document_id=db_doc.id,
                    source=doc["filename"],
                    department=doc["department"],
                    access_level=doc["access_level"],
                    text=chunk,
                    chunk_index=i
                )
                db.add(db_chunk)
            db.commit()

    def process_document(self, db: Session, content: bytes, filename: str, department: str,
                         access_level: str, uploaded_by: str) -> dict:
        text = self._extract_text(content, filename)
        chunks = self._split_into_chunks(text)

        db_doc = Document(
            filename=filename,
            department=department,
            access_level=access_level,
            uploaded_by=uploaded_by,
            chunks_count=len(chunks)
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        chunk_objects = []
        for i, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=db_doc.id,
                source=filename,
                department=department,
                access_level=access_level,
                text=chunk,
                chunk_index=i
            )
            db.add(db_chunk)
            chunk_objects.append({
                "id": db_chunk.id,
                "document_id": db_doc.id,
                "source": filename,
                "department": department,
                "access_level": access_level,
                "text": chunk,
                "chunk_index": i
            })
        db.commit()

        return {
            "document_id": db_doc.id,
            "chunks": chunk_objects,
            "chunks_count": len(chunks),
            "metadata": {"department": department, "access_level": access_level}
        }

    def _extract_text(self, content: bytes, filename: str) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1", errors="replace")

    def _split_into_chunks(self, text: str) -> List[str]:
        # Split by paragraphs first, then by size
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) < self.chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        return chunks if chunks else [text[:self.chunk_size]]

    def list_documents(self, db: Session, role: str) -> List[dict]:
        allowed_access = ROLE_ACCESS_MAP.get(role, ["employee"])
        docs = db.query(Document).filter(Document.access_level.in_(allowed_access)).all()
        
        return [
            {
                "id": doc.id,
                "filename": doc.filename,
                "department": doc.department,
                "access_level": doc.access_level,
                "uploaded_by": doc.uploaded_by,
                "uploaded_at": doc.uploaded_at.isoformat(),
                "chunk_count": doc.chunks_count,
                "file_size": 0  # To maintain backwards compatibility if used
            }
            for doc in docs
        ]

    def get_all_chunks(self, db: Session) -> List[dict]:
        chunks = db.query(DocumentChunk).all()
        return [
            {
                "id": c.id,
                "document_id": c.document_id,
                "source": c.source,
                "department": c.department,
                "access_level": c.access_level,
                "text": c.text,
                "chunk_index": c.chunk_index
            }
            for c in chunks
        ]
