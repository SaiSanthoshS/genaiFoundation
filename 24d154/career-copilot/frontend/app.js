/* ═══════════════════════════════════════════════════════════════════════════
   AI Career Copilot — Frontend Application Logic
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = "http://localhost:8000";

// ── State ───────────────────────────────────────────────────────────────────

let state = {
    token: localStorage.getItem("cc_token") || "",
    userId: localStorage.getItem("cc_userId") || "",
    userName: localStorage.getItem("cc_userName") || "",
    currentResumeId: localStorage.getItem("cc_resumeId") || "",
    isAuthMode: "register", // "register" or "login"
};

// ── On Load ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    setupDragDrop();
    setupNavigation();

    if (state.token) {
        updateAuthUI(true);
        showPage("dashboard");
        loadDashboard();
    }
});

// ── Navigation ──────────────────────────────────────────────────────────────

function setupNavigation() {
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
        });
    });
}

function showPage(pageName) {
    // Check auth for protected pages
    const protectedPages = ["dashboard", "upload", "jobs", "coverletter", "interview", "tracker", "analytics"];
    if (protectedPages.includes(pageName) && !state.token) {
        showPage("auth");
        toast("Please sign in to continue", "info");
        return;
    }

    // Hide all pages
    document.querySelectorAll(".page").forEach((p) => (p.classList.remove("active")));

    // Show target
    const target = document.getElementById(`page-${pageName}`);
    if (target) {
        target.classList.add("active");
    }

    // Update nav links
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("active", link.dataset.page === pageName);
    });

    // Load data for specific pages
    if (pageName === "dashboard") loadDashboard();
    if (pageName === "tracker") loadTracker();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Auth ────────────────────────────────────────────────────────────────────

function toggleAuthMode() {
    state.isAuthMode = state.isAuthMode === "register" ? "login" : "register";
    const isRegister = state.isAuthMode === "register";

    document.getElementById("authTitle").textContent = isRegister ? "Create Account" : "Welcome Back";
    document.getElementById("authSubtitle").textContent = isRegister ? "Start your AI-powered job search" : "Sign in to your account";
    document.getElementById("nameGroup").style.display = isRegister ? "block" : "none";
    document.getElementById("authSubmit").textContent = isRegister ? "Create Account" : "Sign In";
    document.getElementById("authToggleText").textContent = isRegister ? "Already have an account?" : "Don't have an account?";
    document.getElementById("authToggleLink").textContent = isRegister ? "Sign In" : "Create Account";
}

async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById("authSubmit");
    btn.disabled = true;
    btn.textContent = "Loading...";

    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    const name = document.getElementById("authName").value;

    const endpoint = state.isAuthMode === "register" ? "/auth/register" : "/auth/login";
    const body = state.isAuthMode === "register"
        ? { name, email, password }
        : { email, password };

    try {
        const res = await api(endpoint, "POST", body, false);
        state.token = res.access_token;
        state.userId = res.user_id;
        state.userName = res.name;

        localStorage.setItem("cc_token", state.token);
        localStorage.setItem("cc_userId", state.userId);
        localStorage.setItem("cc_userName", state.userName);

        updateAuthUI(true);
        toast(`Welcome${state.userName ? ", " + state.userName : ""}! 🎉`, "success");
        showPage("dashboard");
    } catch (err) {
        toast(err.message || "Authentication failed", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = state.isAuthMode === "register" ? "Create Account" : "Sign In";
    }
}

function logout() {
    state.token = "";
    state.userId = "";
    state.userName = "";
    state.currentResumeId = "";

    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_userId");
    localStorage.removeItem("cc_userName");
    localStorage.removeItem("cc_resumeId");

    updateAuthUI(false);
    showPage("landing");
    toast("Logged out successfully", "info");
}

function updateAuthUI(isLoggedIn) {
    document.getElementById("navUser").style.display = isLoggedIn ? "flex" : "none";
    document.getElementById("navAuth").style.display = isLoggedIn ? "none" : "block";

    if (isLoggedIn) {
        document.getElementById("userAvatar").textContent = (state.userName || "U")[0].toUpperCase();
    }
}

// ── API Helper ──────────────────────────────────────────────────────────────

async function api(path, method = "GET", body = null, auth = true) {
    const headers = { "Content-Type": "application/json" };
    if (auth && state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || "Request failed");
    }

    return res.json();
}

async function apiUpload(path, formData) {
    const headers = {};
    if (state.token) {
        headers["Authorization"] = `Bearer ${state.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
    }

    return res.json();
}

// ── Dashboard ───────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const data = await api("/analytics/");
        document.getElementById("dashAts").textContent = data.ats_score ? `${data.ats_score}%` : "--";
        document.getElementById("dashApps").textContent = data.applications_sent || 0;
        document.getElementById("dashInterview").textContent = `${data.interview_rate || 0}%`;
        document.getElementById("dashFit").textContent = data.average_fit_score ? `${data.average_fit_score}%` : "--";

        const gapsEl = document.getElementById("skillGaps");
        if (data.skill_gaps && data.skill_gaps.length > 0) {
            gapsEl.innerHTML = data.skill_gaps
                .map((s) => `<span class="tag tag-warning">${s}</span>`)
                .join("");
        }
    } catch {
        // Silent fail — dashboard will show defaults
    }
}

// ── Resume Upload ───────────────────────────────────────────────────────────

function setupDragDrop() {
    const zone = document.getElementById("dropZone");
    if (!zone) return;

    ["dragenter", "dragover"].forEach((evt) => {
        zone.addEventListener(evt, (e) => {
            e.preventDefault();
            zone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach((evt) => {
        zone.addEventListener(evt, (e) => {
            e.preventDefault();
            zone.classList.remove("drag-over");
        });
    });

    zone.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) uploadResume(files[0]);
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) uploadResume(file);
}

async function uploadResume(file) {
    const contentEl = document.getElementById("uploadContent");
    const progressEl = document.getElementById("uploadProgress");
    const statusEl = document.getElementById("uploadStatus");

    contentEl.style.display = "none";
    progressEl.style.display = "flex";
    statusEl.textContent = `Uploading ${file.name}...`;

    try {
        statusEl.textContent = "🧠 AI is parsing your resume...";

        const formData = new FormData();
        formData.append("file", file);

        const resume = await apiUpload("/resume/upload", formData);

        state.currentResumeId = resume.id;
        localStorage.setItem("cc_resumeId", resume.id);

        toast("Resume parsed successfully! 🎉", "success");
        displayResumeReview(resume);
    } catch (err) {
        toast(err.message || "Upload failed", "error");
        contentEl.style.display = "block";
        progressEl.style.display = "none";
    }
}

function displayResumeReview(resume) {
    const contentEl = document.getElementById("uploadContent");
    const progressEl = document.getElementById("uploadProgress");
    const reviewEl = document.getElementById("resumeReview");

    contentEl.style.display = "none";
    progressEl.style.display = "none";
    reviewEl.style.display = "block";

    // ATS Score
    const score = resume.ats_score || 0;
    document.getElementById("atsScoreText").textContent = Math.round(score);
    const circle = document.getElementById("atsCircle");
    if (circle) {
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (score / 100) * circumference;
        circle.style.stroke = score >= 70 ? "#43e97b" : score >= 40 ? "#f7971e" : "#f5576c";
        circle.style.strokeDashoffset = offset;
    }

    // Skills
    const parsed = resume.parsed_data || {};
    const skillsEl = document.getElementById("extractedSkills");
    skillsEl.innerHTML = (parsed.skills || [])
        .map((s) => `<span class="tag">${s}</span>`)
        .join("") || '<span class="tag tag-warning">No skills extracted</span>';

    // Experience
    const expEl = document.getElementById("extractedExperience");
    expEl.innerHTML = (parsed.experience || [])
        .map(
            (e) => `
        <div class="timeline-item">
            <h4>${e.title || "Position"} @ ${e.company || "Company"}</h4>
            <p>${e.duration || e.start_date || ""} ${e.description ? "— " + e.description.substring(0, 100) + "..." : ""}</p>
        </div>
    `
        )
        .join("") || '<p class="text-muted">No experience data extracted.</p>';

    // ATS Feedback
    const feedback = resume.ats_feedback || {};
    const feedbackEl = document.getElementById("atsFeedback");
    let feedbackHTML = "";

    (feedback.formatting_issues || []).forEach((issue) => {
        feedbackHTML += `<div class="feedback-item">⚠️ ${issue}</div>`;
    });
    (feedback.suggestions || []).forEach((tip) => {
        feedbackHTML += `<div class="feedback-item suggestion">💡 ${tip}</div>`;
    });
    (feedback.missing_keywords || []).forEach((kw) => {
        feedbackHTML += `<div class="feedback-item">🔑 Missing keyword: <strong>${kw}</strong></div>`;
    });

    feedbackEl.innerHTML = feedbackHTML || '<p class="text-muted">No issues found!</p>';
}

// ── Job Search ──────────────────────────────────────────────────────────────

async function searchJobs() {
    const btn = document.getElementById("searchBtn");
    const query = document.getElementById("jobQuery").value;
    const location = document.getElementById("jobLocation").value;
    const resultsEl = document.getElementById("jobResults");

    btn.disabled = true;
    btn.innerHTML = '<div class="progress-spinner" style="width:18px;height:18px;border-width:2px;"></div> Searching...';
    resultsEl.innerHTML = '<div class="empty-state"><div class="progress-spinner"></div><p>🔍 Searching job boards...</p></div>';

    try {
        let jobs;

        if (state.currentResumeId) {
            // Use AI matching
            const params = new URLSearchParams({
                resume_id: state.currentResumeId,
                query,
                limit: "12",
            });
            jobs = await api(`/jobs/match?${params}`, "POST");
            renderMatchedJobs(jobs);
        } else {
            // Basic search without matching
            const params = new URLSearchParams({
                query,
                location,
                limit: "12",
            });
            jobs = await api(`/jobs/search?${params}`);
            renderBasicJobs(jobs);
        }
    } catch (err) {
        toast(err.message || "Search failed", "error");
        resultsEl.innerHTML = `<div class="empty-state"><p>❌ ${err.message || "Search failed"}. Make sure the backend is running.</p></div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔍 Search';
    }
}

function renderMatchedJobs(matches) {
    const resultsEl = document.getElementById("jobResults");

    if (!matches || matches.length === 0) {
        resultsEl.innerHTML = '<div class="empty-state"><p>No matching jobs found. Try a different search term.</p></div>';
        return;
    }

    resultsEl.innerHTML = matches
        .map(
            (m) => `
        <div class="job-card" onclick="selectJob('${m.job.id}', ${JSON.stringify(m).replace(/"/g, "&quot;")})">
            <div class="job-card-header">
                <div>
                    <div class="job-card-title">${m.job.title}</div>
                    <div class="job-card-company">${m.job.company}</div>
                </div>
                <div class="job-card-score">
                    <span class="score-number">${Math.round(m.fit_score)}</span>
                    <span class="score-label">Fit Score</span>
                </div>
            </div>
            <div class="job-card-meta">
                <span>📍 ${m.job.location || "Remote"}</span>
                <span>💰 ${m.job.salary_range || "N/A"}</span>
                <span>🔗 ${m.job.source}</span>
            </div>
            <div class="job-card-tags">
                ${(m.missing_skills || []).slice(0, 4).map((s) => `<span class="tag tag-danger">${s}</span>`).join("")}
                ${(m.match_reasons || []).slice(0, 2).map((r) => `<span class="tag tag-success">${r}</span>`).join("")}
            </div>
            <div class="job-card-actions">
                <button class="btn-primary btn-sm" onclick="event.stopPropagation(); generateCoverLetter('${m.job.id}')">✉️ Cover Letter</button>
                <button class="btn-outline btn-sm" onclick="event.stopPropagation(); applyToJob('${m.job.id}', '${m.job.title}', '${m.job.company}')">📋 Track</button>
                ${m.job.source_url ? `<a href="${m.job.source_url}" target="_blank" class="btn-outline btn-sm" onclick="event.stopPropagation()">🔗 Apply</a>` : ""}
            </div>
        </div>
    `
        )
        .join("");
}

function renderBasicJobs(jobs) {
    const resultsEl = document.getElementById("jobResults");

    if (!jobs || jobs.length === 0) {
        resultsEl.innerHTML = '<div class="empty-state"><p>No jobs found. Try a different search term.</p></div>';
        return;
    }

    resultsEl.innerHTML = jobs
        .map(
            (j) => `
        <div class="job-card">
            <div class="job-card-header">
                <div>
                    <div class="job-card-title">${j.title}</div>
                    <div class="job-card-company">${j.company}</div>
                </div>
            </div>
            <div class="job-card-meta">
                <span>📍 ${j.location || "Remote"}</span>
                <span>💰 ${j.salary_range || "N/A"}</span>
                <span>🔗 ${j.source}</span>
            </div>
            <div class="job-card-tags">
                ${(j.requirements || []).slice(0, 5).map((r) => `<span class="tag">${r}</span>`).join("")}
            </div>
            <div class="job-card-actions">
                <button class="btn-outline btn-sm" onclick="applyToJob('${j.id}', '${j.title}', '${j.company}')">📋 Track</button>
                ${j.source_url ? `<a href="${j.source_url}" target="_blank" class="btn-outline btn-sm">🔗 View</a>` : ""}
            </div>
        </div>
    `
        )
        .join("");
}

// ── Cover Letter ────────────────────────────────────────────────────────────

async function generateCoverLetter(jobId) {
    if (!state.currentResumeId) {
        toast("Upload a resume first!", "info");
        showPage("upload");
        return;
    }

    toast("Generating cover letter... ✍️", "info");

    try {
        const result = await api("/cover-letter/generate", "POST", {
            job_id: jobId,
            resume_id: state.currentResumeId,
        });

        document.getElementById("coverLetterContent").value = result.content;
        document.getElementById("coverLetterJobTitle").textContent = `Cover Letter ID: ${result.id}`;
        showPage("coverletter");
        toast("Cover letter generated! ✨", "success");
    } catch (err) {
        toast(err.message || "Failed to generate cover letter", "error");
    }
}

function copyCoverLetter() {
    const content = document.getElementById("coverLetterContent").value;
    navigator.clipboard.writeText(content);
    toast("Copied to clipboard! 📋", "success");
}

function downloadCoverLetter() {
    const content = document.getElementById("coverLetterContent").value;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover_letter.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast("Downloaded! 💾", "success");
}

// ── Application Tracker ─────────────────────────────────────────────────────

async function applyToJob(jobId, title, company) {
    try {
        await api("/applications/", "POST", {
            job_id: jobId,
            notes: `Applied to ${title} at ${company}`,
        });
        toast(`Tracked: ${title} at ${company} 📋`, "success");
        loadTracker();
    } catch (err) {
        toast(err.message || "Failed to track application", "error");
    }
}

async function loadTracker() {
    try {
        const apps = await api("/applications/");

        const columns = {
            applied: [],
            interview: [],
            offer: [],
            rejected: [],
        };

        apps.forEach((app) => {
            const status = app.status || "applied";
            if (columns[status]) {
                columns[status].push(app);
            }
        });

        Object.entries(columns).forEach(([status, items]) => {
            const container = document.getElementById(`kanban${status.charAt(0).toUpperCase() + status.slice(1)}`);
            const count = document.getElementById(`count${status.charAt(0).toUpperCase() + status.slice(1)}`);

            if (count) count.textContent = items.length;

            if (container) {
                container.innerHTML = items
                    .map(
                        (app) => `
                    <div class="kanban-card" draggable="true" data-id="${app.id}">
                        <div class="kanban-card-title">${app.job.title}</div>
                        <div class="kanban-card-company">${app.job.company}</div>
                        <div class="kanban-card-date">${new Date(app.applied_at).toLocaleDateString()}</div>
                        <div class="kanban-card-actions">
                            <select onchange="updateAppStatus('${app.id}', this.value)">
                                <option value="applied" ${app.status === "applied" ? "selected" : ""}>Applied</option>
                                <option value="interview" ${app.status === "interview" ? "selected" : ""}>Interview</option>
                                <option value="offer" ${app.status === "offer" ? "selected" : ""}>Offer</option>
                                <option value="rejected" ${app.status === "rejected" ? "selected" : ""}>Rejected</option>
                            </select>
                        </div>
                    </div>
                `
                    )
                    .join("") || "";
            }
        });
    } catch {
        // Silent fail — tracker will show empty
    }
}

async function updateAppStatus(appId, newStatus) {
    try {
        await api(`/applications/${appId}`, "PUT", { status: newStatus });
        toast(`Status updated to: ${newStatus}`, "success");
        loadTracker();
    } catch (err) {
        toast(err.message || "Failed to update status", "error");
    }
}

// ── Interview Prep ──────────────────────────────────────────────────────────

async function generateInterview(jobId) {
    if (!state.currentResumeId) {
        toast("Upload a resume first!", "info");
        return;
    }

    try {
        const result = await api("/interview/questions", "POST", {
            job_id: jobId,
            resume_id: state.currentResumeId,
            question_types: ["hr", "technical", "behavioral"],
        });

        displayInterviewQuestions(result.questions);
        showPage("interview");
        toast("Interview questions generated! 🎤", "success");
    } catch (err) {
        toast(err.message || "Failed to generate questions", "error");
    }
}

function displayInterviewQuestions(questions) {
    const container = document.getElementById("interviewQuestions");

    if (!questions || questions.length === 0) {
        container.innerHTML = '<div class="glass-card empty-state"><p>No questions generated.</p></div>';
        return;
    }

    container.innerHTML = questions
        .map(
            (q) => `
        <div class="question-card">
            <span class="question-type type-${q.type}">${q.type}</span>
            <div class="question-text">${q.question}</div>
            <div class="answer-section">
                <h5>💡 Sample Answer</h5>
                <p>${q.sample_answer || "Think about a relevant experience from your background."}</p>
            </div>
            <div class="answer-section">
                <h5>🎯 Tips</h5>
                <p>${q.tips || "Use the STAR method: Situation, Task, Action, Result."}</p>
            </div>
        </div>
    `
        )
        .join("");
}

// ── Toast Notifications ─────────────────────────────────────────────────────

function toast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateX(100px)";
        el.style.transition = "all 0.3s ease";
        setTimeout(() => el.remove(), 300);
    }, 4000);
}

// ── Utility ─────────────────────────────────────────────────────────────────

function selectJob(jobId, match) {
    // Could open a modal or navigate to job details
    console.log("Selected job:", jobId, match);
}
