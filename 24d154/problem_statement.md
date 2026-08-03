Problem Statement : 

Job Application Assistant
Agent: When user uploads their resume, the agent parses it to extract skills and experience, searches multiple job boards for matching openings, scores each listing for fit, fetches company culture ratings, and drafts a personalised cover letter for the top match.

Frontend: Resume Upload Page — drag-and-drop PDF triggers the agent pipeline | Job Matches Dashboard — displays agent-ranked listings with fit scores, company ratings, and salary ranges | Cover Letter Editor — shows the agent-drafted letter with an editable text area; user clicks "Apply" to send | Application Tracker Kanban — columns for Applied / Interview / Offer, cards auto-added by the agent after each application

What needs to be done and how ??

AI Career Copilot
> Software Requirements Specification (Condensed Master Blueprint)
1. Vision
Build an AI-powered career assistant that helps users:
Upload resumes (PDF/DOCX)
Parse and optimize resumes for ATS
Discover jobs from free-friendly sources
Rank jobs by AI fit score
Generate tailored resumes and cover letters
Prepare for interviews
Track applications
Analyze career progress
2. Target Users
Students
Freshers
Experienced professionals
3. Tech Stack
Layer	Choice
Frontend	Next.js + Tailwind + TypeScript
Backend	FastAPI
Auth	Supabase Auth
DB	PostgreSQL (Supabase)
Storage	Supabase Storage
AI Orchestration	LangGraph
Local LLM	Ollama (Qwen3/Llama3.1/Mistral)
Embeddings	sentence-transformers
Vector DB	pgvector
Email	Resend
Deploy	Vercel + Render
4. Core Modules
Authentication
Resume Upload
Resume Parser
ATS Analyzer
Candidate Profile Builder
Job Aggregator
Job Matching Engine
Company Insights
Resume Tailoring
Cover Letter Generator
Interview Coach
Career Advisor
Application Tracker
Analytics Dashboard
Notifications
5. AI Agents
Resume Parsing Agent
Input: PDF/DOCX
Output: Structured JSON
Extract:
Skills
Education
Experience
Projects
Certifications
Keywords
ATS Agent
Returns:
ATS score
Missing keywords
Formatting issues
Suggested improvements
Job Search Agent
Sources:
Greenhouse
Lever
Wellfound
RemoteOK
Remotive
Arbeitnow
Job Matching Agent
Scores:
Skill match
Experience
Education
Projects
Keywords
Location
Salary
Output:
Fit score
Missing skills
Why matched
Resume Tailoring Agent
Generates a customized resume for each selected job.
Cover Letter Agent
Creates a personalized cover letter using resume + job description.
Interview Agent
Creates:
HR questions
Technical questions
Behavioral questions
STAR feedback
Mock interview
Career Advisor
Suggests:
Skills to learn
Courses
Certifications
Career roadmap
6. Database (Major Tables)
Users
Resumes
CandidateProfiles
Jobs
JobMatches
Applications
CoverLetters
InterviewSessions
Notifications
Analytics
7. Main User Flow
Login
→ Upload Resume
→ Parse Resume
→ ATS Analysis
→ Search Jobs
→ Rank Jobs
→ View Match
→ Tailor Resume
→ Generate Cover Letter
→ Open Application Page
→ Track Application
→ Prepare for Interview
8. APIs
POST /auth/login
POST /resume/upload
POST /resume/parse
GET /jobs/search
POST /jobs/match
POST /resume/tailor
POST /cover-letter/generate
POST /interview/questions
GET /analytics
GET /notifications
9. Frontend Pages
Landing
Login
Dashboard
Resume Upload
Resume Review
Job Dashboard
Job Details
Tailored Resume
Cover Letter Editor
Interview Prep
Analytics
Kanban Tracker
Settings
10. Dashboard Widgets
ATS Score
Applications Sent
Interview Rate
Average Fit Score
Salary Trends
Skill Gap
Recommended Jobs
Daily Digest
11. Folder Structure
```text
career-copilot/
 docs/
 frontend/
 backend/
 agents/
 prompts/
 services/
 database/
 tests/
```
12. Environment Variables
OPENAI_API_KEY (optional)
OLLAMA_HOST
SUPABASE_URL
SUPABASE_KEY
DATABASE_URL
RESEND_API_KEY
13. Free Resources
Ollama
Supabase Free
Vercel
Render
LangGraph
pgvector
sentence-transformers
14. Stretch Features
GitHub portfolio analyzer
LinkedIn profile reviewer
Recruiter simulation
Salary estimator
Daily job digest
Skill-gap heatmap
AI networking message generator
15. Inputs Required From User
Mandatory
Name
Email
Resume (PDF/DOCX)
Optional
LinkedIn URL
GitHub URL
Portfolio URL
Preferred roles
Preferred locations
Salary expectation
Work authorization
Years of experience
Preferred employment type
Skills to prioritize
16. Development Roadmap
Phase 1: Auth + Resume Upload
Phase 2: Parsing + ATS
Phase 3: Job Search + Matching
Phase 4: Resume Tailoring + Cover Letters
Phase 5: Tracker + Analytics
Phase 6: Interview Coach + Career Advisor
Phase 7: Polish, tests, deployment