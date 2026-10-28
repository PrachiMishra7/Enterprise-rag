BEGIN TRANSACTION;
CREATE TABLE agent_prompts (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	system_prompt TEXT NOT NULL, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "agent_prompts" VALUES('hr','HR Specialist','You are an HR specialist assistant. Answer questions about leave policies, employee conduct, payroll, attendance, onboarding, and HR procedures based strictly on the provided company documents.','2026-06-22 09:10:38.031467');
INSERT INTO "agent_prompts" VALUES('legal','Legal Counsel','You are a Legal compliance assistant. Answer questions about contracts, NDAs, compliance requirements, and legal procedures based strictly on the provided company documents.','2026-06-22 09:10:38.031467');
INSERT INTO "agent_prompts" VALUES('finance','Finance Expert','You are a Finance assistant. Answer questions about expense reimbursements, budgets, allowances, invoices, and financial procedures based strictly on the provided company documents.','2026-06-22 09:10:38.031467');
INSERT INTO "agent_prompts" VALUES('it','IT Support','You are an IT Support assistant. Answer questions about software, hardware, passwords, support tickets, and IT procedures based strictly on the provided company documents.','2026-06-22 09:10:38.031467');
INSERT INTO "agent_prompts" VALUES('general','General Assistant','You are a general enterprise assistant. Answer questions based strictly on the provided company documents.','2026-06-22 09:10:38.031467');
CREATE TABLE document_chunks (
	id VARCHAR NOT NULL, 
	document_id VARCHAR, 
	source VARCHAR NOT NULL, 
	department VARCHAR, 
	access_level VARCHAR, 
	text TEXT NOT NULL, 
	chunk_index INTEGER, embedding VECTOR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id)
);
INSERT INTO "document_chunks" VALUES('92f990b1-fd7d-4ec2-b3a7-825fbfea0162','2fe58f48-ef79-4b88-a45f-3cffef19294b','HR_Leave_Policy.txt','hr','employee','HR LEAVE POLICY - ACME Corporation

ANNUAL LEAVE
All full-time employees are entitled to 21 days of annual leave per calendar year.
Annual leave accrues at 1.75 days per month of employment.
Employees must submit leave requests at least 7 days in advance through the HR portal.
Unused leave of up to 10 days can be carried forward to the next year.
Leave encashment is available for up to 5 days per year.',0,NULL);
INSERT INTO "document_chunks" VALUES('4d781c46-287a-44fe-8374-fa4dbe590964','2fe58f48-ef79-4b88-a45f-3cffef19294b','HR_Leave_Policy.txt','hr','employee','SICK LEAVE
Employees are entitled to 12 days of sick leave per year.
Sick leave beyond 3 consecutive days requires a medical certificate.
Sick leave cannot be carried forward to the next year.

MATERNITY/PATERNITY LEAVE
Maternity leave: 26 weeks for the first two children, 12 weeks thereafter.
Paternity leave: 15 days within 6 months of childbirth.
Adoption leave: 12 weeks for legal adoption of a child under 3 months.',1,NULL);
INSERT INTO "document_chunks" VALUES('1a244782-d17e-4541-995c-6ca165b6e652','2fe58f48-ef79-4b88-a45f-3cffef19294b','HR_Leave_Policy.txt','hr','employee','EMERGENCY LEAVE
2 days emergency leave per year for immediate family emergencies.
Emergency leave requires approval from the direct manager and HR.

UNPAID LEAVE
Employees may apply for unpaid leave for personal reasons.
Maximum 30 days unpaid leave per year, subject to manager approval.',2,NULL);
INSERT INTO "document_chunks" VALUES('2ec7daf8-40bf-476f-aa0f-c20a889c8007','ce793584-54f2-4d2b-823e-b62ae85d7140','Employee_Code_of_Conduct.txt','hr','employee','EMPLOYEE CODE OF CONDUCT - ACME Corporation

PROFESSIONIONAL BEHAVIOR
All employees must maintain professional conduct at all times.
Harassment, discrimination, or bullying of any kind is strictly prohibited.
Employees must respect confidentiality of company and client information.',0,NULL);
INSERT INTO "document_chunks" VALUES('ccab1309-4787-4d0f-910f-e821f851ca79','ce793584-54f2-4d2b-823e-b62ae85d7140','Employee_Code_of_Conduct.txt','hr','employee','ATTENDANCE AND PUNCTUALITY
Standard working hours are 9:00 AM to 6:00 PM, Monday to Friday.
Employees are expected to maintain 90% attendance per quarter.
Remote work is permitted up to 2 days per week with manager approval.
Late arrivals exceeding 15 minutes should be reported to the manager.',1,NULL);
INSERT INTO "document_chunks" VALUES('69de22bc-6f56-41a5-9021-e6b882a39ad0','ce793584-54f2-4d2b-823e-b62ae85d7140','Employee_Code_of_Conduct.txt','hr','employee','CONFLICT OF INTEREST
Employees must disclose any conflict of interest to HR immediately.
Employees may not work for direct competitors during employment.
External consulting requires written approval from the management.

DATA SECURITY
Employees must not share company passwords or access credentials.
Company data must not be stored on personal devices without IT approval.
Suspected data breaches must be reported to IT security immediately.',2,NULL);
INSERT INTO "document_chunks" VALUES('86aab993-af65-4974-9bed-0f78e4fc173c','ce793584-54f2-4d2b-823e-b62ae85d7140','Employee_Code_of_Conduct.txt','hr','employee','SOCIAL MEDIA POLICY
Employees must not post confidential company information on social media.
Employees may not make statements that could damage company reputation.',3,NULL);
INSERT INTO "document_chunks" VALUES('bb4e9120-cf17-496a-a911-afda9c959ccd','9290eade-4943-4d2d-ab2d-7c950f096a1c','Expense_Reimbursement_Policy.txt','finance','employee','EXPENSE REIMBURSEMENT POLICY - ACME Corporation

ELIGIBLE EXPENSES
Travel expenses for official business travel are reimbursable.
Accommodation up to INR 5000 per night in metro cities, INR 3000 elsewhere.
Meal allowance: INR 500 per day for domestic travel, USD 50 for international.
Local conveyance by auto/cab up to INR 300 per trip is reimbursable.',0,NULL);
INSERT INTO "document_chunks" VALUES('13ec0195-8346-4864-9bd3-77a116de3802','9290eade-4943-4d2d-ab2d-7c950f096a1c','Expense_Reimbursement_Policy.txt','finance','employee','SUBMISSION PROCESS
All expense claims must be submitted within 30 days of incurring the expense.
Original receipts or digital invoices are mandatory for all claims above INR 500.
Claims must be submitted through the Finance Portal with manager approval.
Approved claims are processed within 7 working days.

AIR TRAVEL POLICY
Economy class for all domestic travel.
Business class permitted for international travel exceeding 6 hours.
Flight bookings must be made through the approved travel desk.',1,NULL);
INSERT INTO "document_chunks" VALUES('c4648c2f-5cdc-452e-a1f3-7c68190ef49d','9290eade-4943-4d2d-ab2d-7c950f096a1c','Expense_Reimbursement_Policy.txt','finance','employee','MOBILE AND INTERNET ALLOWANCE
Monthly mobile allowance: INR 1000 for executives, INR 500 for employees.
Internet allowance for remote work: INR 800 per month.

NON-REIMBURSABLE EXPENSES
Personal entertainment, alcohol, and personal shopping are not reimbursable.
Traffic fines and penalties are not reimbursable.',2,NULL);
INSERT INTO "document_chunks" VALUES('a44abdc2-73d3-42af-b425-edfd22e9edcd','0c569e36-32e7-40ee-9903-f665e50307f5','IT_Support_SOP.txt','it','employee','IT SUPPORT STANDARD OPERATING PROCEDURES - ACME Corporation

RAISING A SUPPORT TICKET
All IT issues must be reported through the IT helpdesk portal at it.acme.com.
For urgent issues, call the IT hotline: 1800-IT-HELP (available 24/7).
Ticket priority levels: P1 (Critical), P2 (High), P3 (Medium), P4 (Low).',0,NULL);
INSERT INTO "document_chunks" VALUES('2a4052ab-a057-478e-8969-c8f25c26a2e7','0c569e36-32e7-40ee-9903-f665e50307f5','IT_Support_SOP.txt','it','employee','RESPONSE TIME SLAs
P1 Critical (system down): Response within 30 minutes, resolution within 4 hours.
P2 High (major functionality impacted): Response within 2 hours, resolution within 8 hours.
P3 Medium (minor functionality issues): Response within 4 hours, resolution within 24 hours.
P4 Low (general queries): Response within 1 business day, resolution within 3 days.',1,NULL);
INSERT INTO "document_chunks" VALUES('a8386c57-08c4-4dd4-84fd-12ad694428c5','0c569e36-32e7-40ee-9903-f665e50307f5','IT_Support_SOP.txt','it','employee','PASSWORD RESET PROCEDURE
Self-service password reset available at accounts.acme.com.
For locked accounts, contact IT helpdesk with employee ID.
Passwords must be at least 12 characters with uppercase, numbers, and special characters.
Passwords must be changed every 90 days.',2,NULL);
INSERT INTO "document_chunks" VALUES('c3cc650d-4fff-4862-af46-83227438ae81','0c569e36-32e7-40ee-9903-f665e50307f5','IT_Support_SOP.txt','it','employee','SOFTWARE INSTALLATION
All software installations require IT department approval.
Submit a software request form at it.acme.com/software-request.
Licensed software list is available on the IT portal.
Unauthorized software installation may result in disciplinary action.

EQUIPMENT POLICY
New joiners receive laptop, mouse, keyboard, and headset on Day 1.
Equipment loss or damage must be reported to IT within 24 hours.
All company devices must be returned upon resignation or termination.',3,NULL);
INSERT INTO "document_chunks" VALUES('34174565-31ef-4456-bc83-d78ebe098a5e','90920654-cf7c-403a-9768-ceb0176f01c6','NDA_Template_Guidelines.txt','legal','manager','NON-DISCLOSURE AGREEMENT GUIDELINES - ACME Corporation Legal Department

PURPOSE
This document outlines guidelines for Non-Disclosure Agreements (NDAs) with clients, vendors, and partners.

STANDARD NDA TERMS
NDAs are valid for 3 years from the date of signing unless otherwise specified.
All confidential information shared during business discussions is covered.
Exceptions include publicly available information and independently developed information.',0,NULL);
INSERT INTO "document_chunks" VALUES('27b69426-4a80-4bb9-a97a-9f53a15a03cc','90920654-cf7c-403a-9768-ceb0176f01c6','NDA_Template_Guidelines.txt','legal','manager','SIGNING AUTHORITY
NDAs below INR 10 Lakhs: Department Manager can sign.
NDAs between INR 10 Lakhs to INR 1 Crore: VP or Director level required.
NDAs above INR 1 Crore: C-suite executive signature required.

NDA PROCESS
Draft NDA using the approved template from the Legal portal.
Submit for legal review at least 5 business days before signing deadline.
All executed NDAs must be filed in the Legal Document Management System.',1,NULL);
INSERT INTO "document_chunks" VALUES('80557b2e-7b9b-48b3-9f7e-abc6452c2f6d','90920654-cf7c-403a-9768-ceb0176f01c6','NDA_Template_Guidelines.txt','legal','manager','VIOLATION CONSEQUENCES
Breach of NDA may result in immediate termination and legal action.
Employees must report suspected NDA breaches to the Legal team within 24 hours.',2,NULL);
INSERT INTO "document_chunks" VALUES('afe56528-5efc-4897-8688-cb9e2dd7051a','bf2730c6-6348-4db7-b58b-561cff4928ef','Week3_Class1_Worksheet1_Bias_Fairness.docx','general','employee','PK',0,NULL);
CREATE TABLE documents (
	id VARCHAR NOT NULL, 
	filename VARCHAR NOT NULL, 
	department VARCHAR, 
	access_level VARCHAR, 
	uploaded_by VARCHAR, 
	uploaded_at DATETIME, 
	chunks_count INTEGER, 
	PRIMARY KEY (id), 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
);
INSERT INTO "documents" VALUES('2fe58f48-ef79-4b88-a45f-3cffef19294b','HR_Leave_Policy.txt','hr','employee',NULL,'2026-06-15 07:08:44.141847',3);
INSERT INTO "documents" VALUES('ce793584-54f2-4d2b-823e-b62ae85d7140','Employee_Code_of_Conduct.txt','hr','employee',NULL,'2026-06-15 07:08:44.204792',4);
INSERT INTO "documents" VALUES('9290eade-4943-4d2d-ab2d-7c950f096a1c','Expense_Reimbursement_Policy.txt','finance','employee',NULL,'2026-06-15 07:08:44.222802',3);
INSERT INTO "documents" VALUES('0c569e36-32e7-40ee-9903-f665e50307f5','IT_Support_SOP.txt','it','employee',NULL,'2026-06-15 07:08:44.238960',4);
INSERT INTO "documents" VALUES('90920654-cf7c-403a-9768-ceb0176f01c6','NDA_Template_Guidelines.txt','legal','manager',NULL,'2026-06-15 07:08:44.255112',3);
INSERT INTO "documents" VALUES('bf2730c6-6348-4db7-b58b-561cff4928ef','Week3_Class1_Worksheet1_Bias_Fairness.docx','general','employee','44384a36-5b85-46ae-b696-fb784437046f','2026-06-15 08:40:16.654626',1);
CREATE TABLE query_logs (
	id VARCHAR NOT NULL, 
	user_id VARCHAR, 
	"query" VARCHAR NOT NULL, 
	agent VARCHAR, 
	confidence_score INTEGER, 
	hallucination_detected BOOLEAN, 
	created_at DATETIME, tokens_used INTEGER DEFAULT 0, user_feedback INTEGER DEFAULT 0, context_relevance_score INTEGER DEFAULT 0, faithfulness_score INTEGER DEFAULT 0, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "query_logs" VALUES('055f5606-9b2c-4477-a345-d601779da167','f3922b62-d230-43a9-8554-737e9d2b24b2','What is the remote work policy?','hr',67,0,'2026-06-22 06:22:30.681571',0,0,0,0);
INSERT INTO "query_logs" VALUES('9591759b-b5d3-4358-b18d-ecebd6d119dc','f3922b62-d230-43a9-8554-737e9d2b24b2','How to claim expenses?','finance',71,0,'2026-06-22 06:22:38.050464',0,0,0,0);
INSERT INTO "query_logs" VALUES('d7cd1081-036c-4d96-aeb1-7547054fac0e','f3922b62-d230-43a9-8554-737e9d2b24b2','What is the remote work policy?','hr',74,0,'2026-06-22 08:54:37.080069',0,0,0,0);
INSERT INTO "query_logs" VALUES('bbb7a043-b048-4728-bce2-3e8c63a82043','f3922b62-d230-43a9-8554-737e9d2b24b2','What is the remote work policy?','hr',74,0,'2026-06-22 09:36:40.587524',0,0,0,0);
INSERT INTO "query_logs" VALUES('576b8fce-7c50-449e-9d3f-028d93df4cca','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','finance',85,0,'2026-06-22 09:37:50.803956',0,0,0,0);
INSERT INTO "query_logs" VALUES('4d82130e-3bcd-4de9-ba99-06bae97cb851','f3922b62-d230-43a9-8554-737e9d2b24b2','What is the remote work policy?','hr',72,0,'2026-07-20 09:10:56.560150',0,0,0,0);
INSERT INTO "query_logs" VALUES('0cdf0bb2-64e9-4f68-b37a-d284034e1304','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','hr',85,0,'2026-07-20 09:45:42.488276',0,0,0,0);
INSERT INTO "query_logs" VALUES('f964352d-1ac9-4ca7-a5d7-b990ee8e429b','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','finance',85,0,'2026-07-20 09:46:01.668987',0,0,0,0);
INSERT INTO "query_logs" VALUES('666d1ca8-aa00-467a-93a3-07b12bb02f56','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','hr',85,0,'2026-07-20 09:54:40.384134',0,0,0,0);
INSERT INTO "query_logs" VALUES('c6ef9ccd-524c-494a-9f13-7195e30a0309','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','finance',84,0,'2026-07-20 09:54:52.478047',0,0,0,0);
INSERT INTO "query_logs" VALUES('2507a79d-41ce-4f64-bbd8-83619aec90d4','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','it',84,0,'2026-07-20 11:28:44.838644',0,0,0,0);
INSERT INTO "query_logs" VALUES('2ea4d9d5-132d-4906-9279-d9d79c96a4c6','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','it',85,0,'2026-07-21 05:10:54.014863',679,0,92,88);
INSERT INTO "query_logs" VALUES('853f7594-cb6f-409c-bdc6-490c845049ed','f3922b62-d230-43a9-8554-737e9d2b24b2','Summarize the NDA','legal',70,0,'2026-07-21 05:21:24.732034',781,0,92,88);
INSERT INTO "query_logs" VALUES('ff1ebabe-c701-4618-a2bc-78404a05453f','f3922b62-d230-43a9-8554-737e9d2b24b2','How to claim expenses?','finance',78,0,'2026-07-21 05:54:46.524421',758,0,92,88);
INSERT INTO "query_logs" VALUES('d587ada9-bb45-45fc-9d98-e3b3c3c17bde','c87b7b64-ce99-4c91-ac8b-80090eda60d4','what is the leave policy?','general',29,1,'2026-09-07 04:49:22.855991',541,0,40,35);
INSERT INTO "query_logs" VALUES('0e16fb3f-d7eb-4dcd-a2cb-8bcc79b8b61b','c87b7b64-ce99-4c91-ac8b-80090eda60d4','what is the leave policy?','general',29,1,'2026-09-07 04:49:37.248830',541,0,40,35);
INSERT INTO "query_logs" VALUES('53592c74-7ab1-4004-b980-40643db1d38a','c87b7b64-ce99-4c91-ac8b-80090eda60d4','what is the leave policy?','general',29,1,'2026-09-07 04:50:06.405159',541,0,40,35);
INSERT INTO "query_logs" VALUES('d0c6cca0-19e1-4489-8f24-f4e3ab986737','0e599dc1-98fe-4528-92ed-dd92e6621943','Summarize the NDA','hr',88,0,'2026-09-07 07:07:39.912435',696,0,92,88);
INSERT INTO "query_logs" VALUES('5ed79092-27e3-45bf-b2d7-f509f219b092','0e599dc1-98fe-4528-92ed-dd92e6621943','What is the remote work policy?','hr',60,0,'2026-09-07 07:08:09.004001',576,0,92,88);
INSERT INTO "query_logs" VALUES('60e91028-4fd3-45d5-a58a-a51a3d249a97','0e599dc1-98fe-4528-92ed-dd92e6621943','Summarize the NDA','legal',54,0,'2026-09-07 08:01:55.752868',639,0,92,88);
INSERT INTO "query_logs" VALUES('ef902d72-25e8-4e23-bff0-8ff64374e62f','0e599dc1-98fe-4528-92ed-dd92e6621943','Summarize the NDA','legal',48,0,'2026-09-07 08:19:37.603597',662,0,92,88);
INSERT INTO "query_logs" VALUES('ee48248f-356f-470c-8d23-0190306dbe2b','0e599dc1-98fe-4528-92ed-dd92e6621943','How to claim expenses?','finance',12,1,'2026-09-07 10:12:27.406104',483,0,40,35);
INSERT INTO "query_logs" VALUES('bb8f1b49-9d63-476d-931b-bc53561f185f','0e599dc1-98fe-4528-92ed-dd92e6621943','How to claim expenses?','finance',23,1,'2026-09-07 10:17:51.253456',379,0,40,35);
INSERT INTO "query_logs" VALUES('fc4f84df-e3fd-40fe-b67a-b42918562624','0e599dc1-98fe-4528-92ed-dd92e6621943','What is the remote work policy?','hr',32,1,'2026-09-21 04:15:57.485156',584,0,40,35);
INSERT INTO "query_logs" VALUES('baf1456a-21f7-48e8-99d4-5a6f85e1ac75','0e599dc1-98fe-4528-92ed-dd92e6621943','How to claim expenses?','legal',90,0,'2026-09-22 03:42:34.909513',272,0,92,88);
INSERT INTO "query_logs" VALUES('155db909-abbb-42ab-ae2a-27942a4ff802','0e599dc1-98fe-4528-92ed-dd92e6621943','Summarize the NDA','legal',77,0,'2026-09-22 04:33:23.604623',625,0,92,88);
INSERT INTO "query_logs" VALUES('f0b63497-e84e-401e-963e-b26f19cae085','0e599dc1-98fe-4528-92ed-dd92e6621943','What is the remote work policy?','general',71,0,'2026-09-22 04:36:58.231845',578,0,92,88);
INSERT INTO "query_logs" VALUES('786ba136-7739-4f1d-86dd-8304a67e8588','0e599dc1-98fe-4528-92ed-dd92e6621943','Summarize the NDA','legal',58,0,'2026-09-22 04:58:08.397676',625,1,92,88);
INSERT INTO "query_logs" VALUES('27e450c1-16ab-422e-a879-c6da6dff0135','0e599dc1-98fe-4528-92ed-dd92e6621943','How to claim expenses?','finance',23,1,'2026-09-22 04:58:22.640589',441,-1,40,35);
INSERT INTO "query_logs" VALUES('65a48223-e828-456f-89e5-781e44a3a070','0e599dc1-98fe-4528-92ed-dd92e6621943','What is the remote work policy?','general',56,0,'2026-09-22 08:28:18.380720',573,0,92,88);
INSERT INTO "query_logs" VALUES('eff7c569-46bc-4a43-837a-3496ef289a40','0e599dc1-98fe-4528-92ed-dd92e6621943','How to claim expenses?','hr',36,1,'2026-09-22 08:47:07.249235',340,-1,40,35);
INSERT INTO "query_logs" VALUES('eda0becf-5e42-4c37-87fd-4d1c7ba2a025','c87b7b64-ce99-4c91-ac8b-80090eda60d4','What is the remote work policy?','general',74,0,'2026-10-28 09:09:13.545048',568,0,92,88);
INSERT INTO "query_logs" VALUES('cbbe3068-0b62-44f2-a2f3-974f32fc4a33','c87b7b64-ce99-4c91-ac8b-80090eda60d4','How to claim expenses?','finance',25,1,'2026-10-28 09:09:34.486048',512,0,40,35);
CREATE TABLE users (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	email VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	role VARCHAR, 
	department VARCHAR, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO "users" VALUES('16bfc88c-2a74-45ba-a7e0-ff78ab5775af','Alice (Employee)','employee@company.com','$2b$12$lkgLtN54DT9FSGG04bYPdeYAxBuTFQChP0E0tjI5FVQL95CLhljDu','employee','general','2026-08-12 05:20:57.606712');
INSERT INTO "users" VALUES('e81a8334-f311-47df-915b-ddcb2ca8c352','Bob (Manager)','manager@company.com','$2b$12$AZb9HryE3mxKad88uicd4OzIrQHHLSDo1AkPDW6SW4OZUOoMPyTY.','manager','general','2026-08-12 05:20:57.606712');
INSERT INTO "users" VALUES('00dd503f-4188-4e98-9f2d-5a6b8acabc31','Carol (HR Admin)','hr@company.com','$2b$12$Q7neCqz89BiuAxNnCaYabOOuoyiHDrblDr0rMHAp668Be2tWrx.CS','hr_admin','hr','2026-08-12 05:20:57.606712');
INSERT INTO "users" VALUES('1121bd38-fd60-4996-85de-79fed62f69a2','Dave (Legal Admin)','legal@company.com','$2b$12$Y5cKg2Qm39C.KKCOZ1/42ey368LwDThGQcYswYPWn4oyK8iaKiT1O','legal_admin','legal','2026-08-12 05:20:57.606712');
INSERT INTO "users" VALUES('2e3e5cd2-a307-4d81-8aea-48ebefccf5ec','Eve (Finance Admin)','finance@company.com','$2b$12$Vl/OscD.Lg0Cg1zWsOrbt.gVDmYVkigWvfz5OY5KjTXWHQfhUNbcS','finance_admin','finance','2026-08-12 05:20:57.606712');
INSERT INTO "users" VALUES('c87b7b64-ce99-4c91-ac8b-80090eda60d4','Admin','admin@company.com','$2b$12$w0S2InSP/8gvtmTHnNBbyOpwo74Is2dBP6hq/M5Q7zGxWrQ3CxKPG','admin','general','2026-08-12 05:20:57.606712');
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_documents_department ON documents (department);
CREATE INDEX ix_documents_access_level ON documents (access_level);
CREATE INDEX ix_document_chunks_access_level ON document_chunks (access_level);
CREATE INDEX ix_document_chunks_department ON document_chunks (department);
COMMIT;
