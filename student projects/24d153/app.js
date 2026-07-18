/* ═══════════════════════════════════════════════════════════════════════
   OSINT Domain Intelligence Tool — Frontend Application
   ═══════════════════════════════════════════════════════════════════════
   Handles:
     • Form submission + SSE streaming for agent progress
     • D3.js force-directed discovery graph
     • Dynamic findings table with sort/filter
     • Animated risk score gauge (SVG arc)
     • PDF + JSON report export
   ═══════════════════════════════════════════════════════════════════════ */

// ─── State ─────────────────────────────────────────────────────────────
let investigationData = null;
let allFindings = [];
let graphData = { nodes: [], links: [] };
let simulation = null;

// ─── DOM References ────────────────────────────────────────────────────
const form = document.getElementById('investigateForm');
const targetInput = document.getElementById('targetInput');
const btnInvestigate = document.getElementById('btnInvestigate');
const progressSection = document.getElementById('progressSection');
const progressTimeline = document.getElementById('progressTimeline');
const agentStatus = document.getElementById('agentStatus');
const resultsContainer = document.getElementById('resultsContainer');
const findingsBody = document.getElementById('findingsBody');
const reportContent = document.getElementById('reportContent');
const headerStatus = document.getElementById('headerStatus');
const scanLine = document.getElementById('scanLine');
const filterSource = document.getElementById('filterSource');
const filterSeverity = document.getElementById('filterSeverity');
const btnExportJSON = document.getElementById('btnExportJSON');
const btnExportPDF = document.getElementById('btnExportPDF');

// ─── Scope Checkbox Toggle ─────────────────────────────────────────────
document.querySelectorAll('.scope-checkbox').forEach(label => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    label.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        checkbox.checked = !checkbox.checked;
        label.classList.toggle('checked', checkbox.checked);
    });
});

// ─── Form Submit ───────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target = targetInput.value.trim();
    if (!target) return;

    const scopes = Array.from(document.querySelectorAll('.scope-checkbox input:checked'))
        .map(cb => cb.value);
    if (scopes.length === 0) {
        alert('Please select at least one investigation scope.');
        return;
    }

    startInvestigation(target, scopes);
});

// ─── Filters ───────────────────────────────────────────────────────────
filterSource.addEventListener('change', renderFindingsTable);
filterSeverity.addEventListener('change', renderFindingsTable);

// ─── Export Buttons ────────────────────────────────────────────────────
btnExportJSON.addEventListener('click', exportJSON);
btnExportPDF.addEventListener('click', exportPDF);

// ═══════════════════════════════════════════════════════════════════════
// INVESTIGATION ENGINE
// ═══════════════════════════════════════════════════════════════════════

async function startInvestigation(target, scopes) {
    // Reset UI
    setButtonLoading(true);
    setHeaderStatus('active', `Investigating ${target}...`);
    scanLine.classList.add('active');
    progressSection.style.display = 'block';
    resultsContainer.style.display = 'none';
    progressTimeline.innerHTML = '';
    allFindings = [];
    graphData = { nodes: [], links: [] };
    investigationData = null;

    addTimelineItem('🚀', 'Investigation Started', `Target: ${target} | Scopes: ${scopes.join(', ')}`, 'tool');
    agentStatus.textContent = `Investigating ${target}...`;

    try {
        const response = await fetch('/api/investigate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, scopes }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete line

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const event = JSON.parse(line.slice(6));
                        handleSSEEvent(event, target);
                    } catch (err) {
                        // Skip malformed events
                    }
                }
            }
        }
    } catch (err) {
        addTimelineItem('❌', 'Connection Error', err.message, 'error');
        setHeaderStatus('error', 'Investigation failed');
        agentStatus.textContent = 'Investigation failed — check if the server is running.';
    } finally {
        setButtonLoading(false);
        scanLine.classList.remove('active');
    }
}

function handleSSEEvent(event, target) {
    switch (event.type) {
        case 'start':
            addTimelineItem('🤖', 'Agent Initialised', `Scopes: ${event.data?.scopes?.join(', ') || 'all'}`, 'tool');
            break;

        case 'tool_result': {
            const toolName = event.tool;
            const data = event.data;
            const icon = getToolIcon(toolName);
            const title = getToolTitle(toolName);
            let detail = '';

            if (toolName === 'search_github_repos') {
                detail = `Found ${data.count || 0} repositories`;
                processGitHubFindings(data, target);
            } else if (toolName === 'whois_lookup') {
                detail = data.error ? `Error: ${data.error}` : `Registrar: ${data.registrar || 'N/A'}`;
                processWhoisFindings(data, target);
            } else if (toolName === 'dns_resolve') {
                detail = `Resolved ${data.total_records || 0} DNS records`;
                processDNSFindings(data, target);
            } else if (toolName === 'scan_exposed_services') {
                detail = `Found ${data.total_exposed || 0} exposed services (${data.critical_count || 0} critical)`;
                processServiceFindings(data, target);
            } else if (toolName === 'check_ssl_certificate') {
                detail = data.error ? `Error: ${data.error}` : `Issuer: ${data.issuer_org || 'N/A'} | Expires: ${data.days_remaining} days`;
                processSSLFindings(data, target);
            } else if (toolName === 'compute_risk_score') {
                detail = `Risk Score: ${data.overall_score || 0}/100 (${data.risk_level || 'N/A'})`;
            }

            addTimelineItem(icon, title, detail, 'tool');
            agentStatus.textContent = `Completed: ${title}`;
            break;
        }

        case 'complete':
            addTimelineItem('✅', 'Investigation Complete', `${event.data?.steps || '?'} steps | ${event.data?.tokens || '?'} tokens`, 'complete');
            agentStatus.textContent = 'Investigation complete!';
            break;

        case 'result': {
            investigationData = event.data;
            displayResults(investigationData, target);
            setHeaderStatus('ready', 'Investigation complete');
            break;
        }

        case 'error':
            addTimelineItem('❌', 'Error', event.message || 'Unknown error', 'error');
            setHeaderStatus('error', 'Error occurred');
            break;

        case 'done':
            // Stream finished
            break;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FINDINGS PROCESSORS — Convert raw tool results into table rows + graph
// ═══════════════════════════════════════════════════════════════════════

function processGitHubFindings(data, target) {
    // Add target node
    addGraphNode(target, 'target', 30);

    (data.repos || []).forEach(repo => {
        // Table finding
        allFindings.push({
            severity: repo.open_issues > 100 ? 'medium' : 'info',
            source: 'github',
            finding: `Public repo: ${repo.name}`,
            details: `⭐ ${repo.stars} | 🍴 ${repo.forks} | 📝 ${repo.language} | Issues: ${repo.open_issues}`,
        });

        // Graph node
        const nodeId = repo.name.split('/').pop();
        addGraphNode(nodeId, 'repo', 12 + Math.min(repo.stars / 100, 15));
        addGraphLink(target, nodeId);
    });

    if (data.count > 0) {
        allFindings.push({
            severity: data.count > 20 ? 'medium' : 'low',
            source: 'github',
            finding: `${data.count} public repositories found`,
            details: `Large public code footprint increases exposure surface`,
        });
    }
}

function processWhoisFindings(data, target) {
    if (data.error) {
        allFindings.push({
            severity: 'medium',
            source: 'whois',
            finding: `WHOIS lookup failed: ${data.error}`,
            details: 'Could not retrieve registration records',
        });
        return;
    }

    allFindings.push({
        severity: 'info',
        source: 'whois',
        finding: `Domain registered with ${data.registrar || 'N/A'}`,
        details: `Created: ${data.creation_date || 'N/A'} | Expires: ${data.expiration_date || 'N/A'}`,
    });

    if (data.registrant_org && data.registrant_org !== 'N/A') {
        allFindings.push({
            severity: 'info',
            source: 'whois',
            finding: `Registrant: ${data.registrant_org}`,
            details: `Country: ${data.registrant_country || 'N/A'}`,
        });
        addGraphNode(data.registrant_org, 'whois', 18);
        addGraphLink(target, data.registrant_org);
    }

    (data.nameservers || []).forEach(ns => {
        addGraphNode(ns, 'dns', 10);
        addGraphLink(target, ns);
    });
}

function processDNSFindings(data, target) {
    const records = data.records || {};

    Object.entries(records).forEach(([type, entries]) => {
        entries.forEach(entry => {
            let value = typeof entry === 'string' ? entry : (entry.host || entry.mname || JSON.stringify(entry));
            allFindings.push({
                severity: 'info',
                source: 'dns',
                finding: `${type} Record: ${value}`,
                details: `DNS ${type} record for ${data.domain}`,
            });

            // Add to graph
            const nodeLabel = typeof entry === 'string' ? entry : (entry.host || entry.mname || type);
            if (nodeLabel.length < 60) {
                addGraphNode(nodeLabel, 'dns', 10);
                addGraphLink(target, nodeLabel);
            }
        });
    });

    // Check for missing SPF/DMARC
    const txtRecords = records.TXT || [];
    const hasSPF = txtRecords.some(r => typeof r === 'string' && r.includes('spf'));
    const hasDMARC = txtRecords.some(r => typeof r === 'string' && r.includes('dmarc'));

    if (!hasSPF) {
        allFindings.push({
            severity: 'medium',
            source: 'dns',
            finding: 'No SPF record detected',
            details: 'Missing SPF record may allow email spoofing',
        });
    }
}

function processServiceFindings(data, target) {
    (data.services || []).forEach(svc => {
        allFindings.push({
            severity: svc.severity || 'info',
            source: 'services',
            finding: svc.finding || `Port ${svc.port} (${svc.protocol}) open`,
            details: `Service: ${svc.service || 'unknown'} | Port: ${svc.port}`,
        });

        // Graph
        const nodeId = `${svc.protocol}:${svc.port}`;
        addGraphNode(nodeId, 'service', svc.severity === 'critical' ? 18 : 12);
        addGraphLink(target, nodeId);
    });
}

function processSSLFindings(data, target) {
    if (data.error) {
        allFindings.push({
            severity: 'high',
            source: 'ssl',
            finding: `SSL check failed: ${data.error}`,
            details: 'Could not establish TLS connection',
        });
        return;
    }

    allFindings.push({
        severity: 'info',
        source: 'ssl',
        finding: `SSL Certificate issued by ${data.issuer_org || 'N/A'}`,
        details: `CN: ${data.subject_cn || 'N/A'} | Valid until: ${data.valid_until || 'N/A'} | Protocol: ${data.protocol_version || 'N/A'}`,
    });

    (data.issues || []).forEach(issue => {
        allFindings.push({
            severity: issue.severity || 'medium',
            source: 'ssl',
            finding: issue.issue,
            details: `SSL/TLS configuration issue for ${data.domain}`,
        });
    });

    // Graph
    if (data.issuer_org && data.issuer_org !== 'N/A') {
        addGraphNode(data.issuer_org, 'whois', 14);
        addGraphLink(target, data.issuer_org);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// DISPLAY RESULTS
// ═══════════════════════════════════════════════════════════════════════

function displayResults(data, target) {
    resultsContainer.style.display = 'block';

    // Render risk gauge
    const riskData = data.findings?.risk_score;
    if (riskData) {
        animateRiskGauge(riskData.overall_score || 0, riskData.risk_level || 'Info');
        renderRiskBreakdown(riskData.category_scores || {});
    } else {
        animateRiskGauge(0, 'N/A');
    }

    // Render findings table
    renderFindingsTable();

    // Render discovery graph
    renderDiscoveryGraph(target);

    // Render report
    renderReport(data.report || 'No report generated.');

    // Smooth scroll to results
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// ═══════════════════════════════════════════════════════════════════════
// RISK GAUGE — Animated SVG Arc
// ═══════════════════════════════════════════════════════════════════════

function animateRiskGauge(score, level) {
    const gaugeArc = document.getElementById('gaugeArc');
    const gaugeScore = document.getElementById('gaugeScore');
    const gaugeLabel = document.getElementById('gaugeLabel');

    // Determine gradient
    let gradientId;
    if (score >= 75) gradientId = 'gaugeGradCrit';
    else if (score >= 50) gradientId = 'gaugeGradHigh';
    else if (score >= 25) gradientId = 'gaugeGradMed';
    else gradientId = 'gaugeGradLow';

    gaugeArc.setAttribute('stroke', `url(#${gradientId})`);

    // Animate arc (270° sweep = 401 dasharray for r=85)
    const maxDash = 401;
    const targetDash = (score / 100) * maxDash;

    // Animate with requestAnimationFrame
    let currentDash = 0;
    let currentScore = 0;
    const startTime = performance.now();
    const duration = 1500;

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        currentDash = eased * targetDash;
        currentScore = Math.round(eased * score);

        gaugeArc.setAttribute('stroke-dasharray', `${currentDash} ${534 - currentDash}`);
        gaugeScore.textContent = currentScore;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            gaugeLabel.textContent = level;
        }
    }

    requestAnimationFrame(animate);
}

function renderRiskBreakdown(categoryScores) {
    const breakdown = document.getElementById('riskBreakdown');
    const categories = {
        exposed_services: { label: 'Exposed Services', color: '#ff6b35' },
        ssl_tls: { label: 'SSL / TLS', color: '#ffa502' },
        whois: { label: 'WHOIS Records', color: '#7c3aed' },
        github: { label: 'GitHub Exposure', color: '#1e90ff' },
    };

    breakdown.innerHTML = '';
    Object.entries(categories).forEach(([key, meta]) => {
        const score = categoryScores[key] || 0;
        const div = document.createElement('div');
        div.className = 'risk-category';
        div.innerHTML = `
            <span class="risk-cat-label">${meta.label}</span>
            <div class="risk-bar-track">
                <div class="risk-bar-fill" style="background:${meta.color};" data-width="${score}%"></div>
            </div>
            <span class="risk-cat-score">${score}</span>
        `;
        breakdown.appendChild(div);

        // Animate bar after a short delay
        setTimeout(() => {
            div.querySelector('.risk-bar-fill').style.width = `${score}%`;
        }, 200);
    });
}

// ═══════════════════════════════════════════════════════════════════════
// DISCOVERY GRAPH — D3.js Force-Directed
// ═══════════════════════════════════════════════════════════════════════

function addGraphNode(id, type, radius = 12) {
    if (graphData.nodes.find(n => n.id === id)) return;
    graphData.nodes.push({ id, type, radius });
}

function addGraphLink(source, target) {
    if (graphData.links.find(l => l.source === source && l.target === target)) return;
    if (!graphData.nodes.find(n => n.id === source)) return;
    if (!graphData.nodes.find(n => n.id === target)) return;
    graphData.links.push({ source, target });
}

function renderDiscoveryGraph(target) {
    const container = document.getElementById('graphContainer');
    const svg = d3.select('#discoveryGraph');
    svg.selectAll('*').remove();

    const width = container.clientWidth;
    const height = 500;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    if (graphData.nodes.length === 0) {
        svg.append('text')
            .attr('x', width / 2).attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', '#4a5568')
            .text('No graph data available');
        return;
    }

    const colorMap = {
        target: '#00f0ff',
        repo: '#7c3aed',
        dns: '#2ed573',
        service: '#ff6b35',
        whois: '#ffa502',
    };

    // Create simulation
    simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 8));

    // Draw links
    const link = svg.append('g')
        .selectAll('line')
        .data(graphData.links)
        .join('line')
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 1);

    // Draw nodes
    const node = svg.append('g')
        .selectAll('g')
        .data(graphData.nodes)
        .join('g')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // Node circles with glow
    node.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => colorMap[d.type] || '#666')
        .attr('opacity', 0.8)
        .attr('stroke', d => colorMap[d.type] || '#666')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.3)
        .style('filter', d => d.type === 'target' ? 'url(#glow)' : 'none');

    // Node labels
    node.append('text')
        .text(d => truncate(d.id, 18))
        .attr('dy', d => d.radius + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8892a6')
        .attr('font-size', '10px')
        .attr('font-family', "'JetBrains Mono', monospace");

    // Tooltip on hover
    node.append('title')
        .text(d => `${d.id} (${d.type})`);

    // Tick handler
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => {
            d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
            d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
            return `translate(${d.x},${d.y})`;
        });
    });

    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// FINDINGS TABLE
// ═══════════════════════════════════════════════════════════════════════

function renderFindingsTable() {
    const sourceFilter = filterSource.value;
    const severityFilter = filterSeverity.value;

    let filtered = allFindings.filter(f => {
        if (sourceFilter !== 'all' && f.source !== sourceFilter) return false;
        if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
        return true;
    });

    // Sort by severity
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    filtered.sort((a, b) => (sevOrder[a.severity] || 5) - (sevOrder[b.severity] || 5));

    findingsBody.innerHTML = '';

    if (filtered.length === 0) {
        findingsBody.innerHTML = `
            <tr><td colspan="4" class="no-data">
                <div class="no-data-icon">🔍</div>
                No findings match the current filters
            </td></tr>`;
        return;
    }

    filtered.forEach((f, idx) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${idx * 0.03}s`;
        tr.className = 'fade-in';
        tr.innerHTML = `
            <td><span class="severity-badge ${f.severity}">${getSeverityIcon(f.severity)} ${f.severity}</span></td>
            <td><span class="source-badge">${f.source}</span></td>
            <td class="finding-text">${escapeHtml(f.finding)}</td>
            <td class="finding-detail">${escapeHtml(f.details)}</td>
        `;
        findingsBody.appendChild(tr);
    });
}

// ═══════════════════════════════════════════════════════════════════════
// REPORT RENDERER — Simple Markdown-to-HTML
// ═══════════════════════════════════════════════════════════════════════

function renderReport(markdownText) {
    let html = escapeHtml(markdownText);

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Unordered lists
    html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Numbered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    reportContent.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT — JSON & PDF
// ═══════════════════════════════════════════════════════════════════════

function exportJSON() {
    if (!investigationData) {
        alert('No investigation data to export. Run an investigation first.');
        return;
    }

    const blob = new Blob([JSON.stringify(investigationData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_report_${investigationData.target || 'unknown'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function exportPDF() {
    if (!investigationData) {
        alert('No investigation data to export. Run an investigation first.');
        return;
    }

    const btn = btnExportPDF;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> Generating...';
    btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        let y = margin;

        // Title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 180, 220);
        pdf.text('OSINT Intelligence Report', margin, y);
        y += 10;

        // Target info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Target: ${investigationData.target || 'N/A'}`, margin, y);
        y += 5;
        pdf.text(`Generated: ${investigationData.timestamp || new Date().toISOString()}`, margin, y);
        y += 5;
        pdf.text(`Scopes: ${(investigationData.scopes || []).join(', ')}`, margin, y);
        y += 10;

        // Separator
        pdf.setDrawColor(0, 180, 220);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Risk Score
        const riskData = investigationData.findings?.risk_score;
        if (riskData) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(40, 40, 40);
            pdf.text(`Risk Score: ${riskData.overall_score}/100 (${riskData.risk_level})`, margin, y);
            y += 10;
        }

        // Report content
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(50, 50, 50);

        const reportText = investigationData.report || 'No report available.';
        const lines = pdf.splitTextToSize(reportText, contentWidth);

        for (const line of lines) {
            if (y > 275) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, margin, y);
            y += 4.5;
        }

        // Findings Summary
        if (allFindings.length > 0) {
            if (y > 250) { pdf.addPage(); y = margin; }
            y += 8;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 180, 220);
            pdf.text('Findings Summary', margin, y);
            y += 8;

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(50, 50, 50);

            const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            const sorted = [...allFindings].sort((a, b) => (sevOrder[a.severity] || 5) - (sevOrder[b.severity] || 5));

            for (const f of sorted.slice(0, 30)) {
                if (y > 275) { pdf.addPage(); y = margin; }
                const sev = `[${f.severity.toUpperCase()}]`.padEnd(12);
                const src = `[${f.source}]`.padEnd(12);
                const text = `${sev} ${src} ${f.finding}`;
                const wrappedLines = pdf.splitTextToSize(text, contentWidth);
                for (const wl of wrappedLines) {
                    pdf.text(wl, margin, y);
                    y += 4;
                }
                y += 1;
            }
        }

        pdf.save(`osint_report_${investigationData.target || 'unknown'}_${Date.now()}.pdf`);
    } catch (err) {
        console.error('PDF export error:', err);
        alert('PDF export failed. Check console for details.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════

function setButtonLoading(loading) {
    btnInvestigate.disabled = loading;
    btnInvestigate.querySelector('.btn-text').style.display = loading ? 'none' : 'flex';
    btnInvestigate.querySelector('.btn-loading').style.display = loading ? 'flex' : 'none';
}

function setHeaderStatus(state, text) {
    const dot = headerStatus.querySelector('.status-dot');
    const textEl = headerStatus.querySelector('.status-text');
    dot.className = `status-dot ${state === 'active' ? 'active' : state === 'error' ? 'error' : ''}`;
    textEl.textContent = text;
}

function addTimelineItem(icon, title, detail, type = 'tool') {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.innerHTML = `
        <div class="timeline-dot ${type}">${icon}</div>
        <div class="timeline-content">
            <div class="timeline-title">${escapeHtml(title)}</div>
            <div class="timeline-detail">${escapeHtml(detail)}</div>
            <div class="timeline-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    progressTimeline.appendChild(div);
    progressTimeline.scrollTop = progressTimeline.scrollHeight;
}

function getToolIcon(toolName) {
    const icons = {
        search_github_repos: '📂',
        whois_lookup: '📋',
        dns_resolve: '🌐',
        scan_exposed_services: '🔌',
        check_ssl_certificate: '🔒',
        compute_risk_score: '🛡️',
    };
    return icons[toolName] || '🔧';
}

function getToolTitle(toolName) {
    const titles = {
        search_github_repos: 'GitHub Repository Search',
        whois_lookup: 'WHOIS Lookup',
        dns_resolve: 'DNS Resolution',
        scan_exposed_services: 'Exposed Services Scan',
        check_ssl_certificate: 'SSL Certificate Check',
        compute_risk_score: 'Risk Score Computation',
    };
    return titles[toolName] || toolName;
}

function getSeverityIcon(severity) {
    const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', info: '🔵' };
    return icons[severity] || '⚪';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
