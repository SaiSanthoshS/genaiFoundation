"""
OSINT Tool Implementations
===========================
Six reconnaissance tools the Gemini agent can invoke via function calling.
Each tool returns a plain dict so it serialises cleanly as a FunctionResponse.

Real data sources:
  • GitHub REST API (unauthenticated — 60 req/hr)
  • python-whois for WHOIS records
  • dnspython for DNS resolution
  • Python ssl/socket for SSL certificate inspection

Simulated:
  • Exposed-service scanning (Shodan-style stub data)
"""

import json, os, re, ssl, socket, hashlib, random
from datetime import datetime, timezone

import requests

# ─── 1. GitHub Repository Search ─────────────────────────────────────────────

def search_github_repos(target: str) -> dict:
    """Search GitHub for public repositories belonging to an organisation or user.

    Uses the GitHub Search API (no auth required, 10 results/page, 60 req/hr).
    Returns repo names, descriptions, languages, stars, forks, and last-push dates.
    """
    headers = {"Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    # Try org endpoint first, fall back to user search
    results = []
    try:
        # Search by org or user
        url = f"https://api.github.com/search/repositories?q=org:{target}+OR+user:{target}&sort=stars&order=desc&per_page=10"
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            for repo in data.get("items", []):
                results.append({
                    "name": repo["full_name"],
                    "description": (repo.get("description") or "")[:120],
                    "language": repo.get("language") or "Unknown",
                    "stars": repo["stargazers_count"],
                    "forks": repo["forks_count"],
                    "open_issues": repo["open_issues_count"],
                    "last_pushed": repo.get("pushed_at", "N/A"),
                    "url": repo["html_url"],
                    "visibility": "public",
                    "has_wiki": repo.get("has_wiki", False),
                    "has_pages": repo.get("has_pages", False),
                })
        else:
            # Fall back: search repos by keyword
            url2 = f"https://api.github.com/search/repositories?q={target}&sort=stars&order=desc&per_page=10"
            resp2 = requests.get(url2, headers=headers, timeout=15)
            if resp2.status_code == 200:
                data2 = resp2.json()
                for repo in data2.get("items", []):
                    results.append({
                        "name": repo["full_name"],
                        "description": (repo.get("description") or "")[:120],
                        "language": repo.get("language") or "Unknown",
                        "stars": repo["stargazers_count"],
                        "forks": repo["forks_count"],
                        "open_issues": repo["open_issues_count"],
                        "last_pushed": repo.get("pushed_at", "N/A"),
                        "url": repo["html_url"],
                        "visibility": "public",
                    })
    except Exception as e:
        return {"error": str(e), "repos": [], "count": 0}

    return {
        "target": target,
        "repos": results,
        "count": len(results),
        "source": "GitHub REST API",
    }


# ─── 2. WHOIS Lookup ─────────────────────────────────────────────────────────

def whois_lookup(domain: str) -> dict:
    """Fetch WHOIS registration records for a domain.

    Returns registrar, creation/expiry dates, nameservers, registrant org, and status.
    """
    try:
        import whois
        w = whois.whois(domain)

        def _fmt_date(d):
            if isinstance(d, list):
                d = d[0]
            if d:
                return str(d)
            return "N/A"

        nameservers = w.name_servers
        if isinstance(nameservers, list):
            nameservers = [ns.lower() for ns in nameservers]
        elif nameservers:
            nameservers = [str(nameservers).lower()]
        else:
            nameservers = []

        status = w.status
        if isinstance(status, str):
            status = [status]
        elif not status:
            status = []

        return {
            "domain": domain,
            "registrar": w.registrar or "N/A",
            "creation_date": _fmt_date(w.creation_date),
            "expiration_date": _fmt_date(w.expiration_date),
            "updated_date": _fmt_date(w.updated_date),
            "nameservers": nameservers[:6],
            "registrant_org": w.org or "N/A",
            "registrant_country": w.country or "N/A",
            "status": status[:4],
            "dnssec": str(getattr(w, "dnssec", "N/A")),
            "source": "WHOIS",
        }
    except Exception as e:
        return {"domain": domain, "error": str(e), "source": "WHOIS"}


# ─── 3. DNS Resolution ───────────────────────────────────────────────────────

def dns_resolve(domain: str) -> dict:
    """Resolve DNS records (A, AAAA, MX, NS, TXT, CNAME, SOA) for a domain.

    Uses dnspython for reliable, cross-platform lookups.
    """
    try:
        import dns.resolver

        records = {}
        record_types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]

        for rtype in record_types:
            try:
                answers = dns.resolver.resolve(domain, rtype)
                entries = []
                for rdata in answers:
                    if rtype == "MX":
                        entries.append({"priority": rdata.preference, "host": str(rdata.exchange)})
                    elif rtype == "SOA":
                        entries.append({
                            "mname": str(rdata.mname),
                            "rname": str(rdata.rname),
                            "serial": rdata.serial,
                        })
                    else:
                        entries.append(str(rdata))
                if entries:
                    records[rtype] = entries
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers):
                continue
            except Exception:
                continue

        return {
            "domain": domain,
            "records": records,
            "record_types_found": list(records.keys()),
            "total_records": sum(len(v) for v in records.values()),
            "source": "DNS",
        }
    except Exception as e:
        return {"domain": domain, "error": str(e), "records": {}, "source": "DNS"}


# ─── 4. Exposed Services Scanner (Simulated) ─────────────────────────────────

def scan_exposed_services(target: str) -> dict:
    """Scan for exposed services and open ports on a target domain.

    This is a SIMULATED scanner that generates realistic Shodan-style results
    based on the domain characteristics. In production, you would integrate
    with Shodan, Censys, or similar APIs.
    """
    # Generate deterministic but realistic-looking results based on domain hash
    seed = int(hashlib.md5(target.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    common_services = [
        {"port": 80, "protocol": "HTTP", "service": "nginx/1.24.0", "severity": "info",
         "finding": "HTTP service detected — consider enforcing HTTPS redirect"},
        {"port": 443, "protocol": "HTTPS", "service": "nginx/1.24.0", "severity": "info",
         "finding": "HTTPS service running with TLS 1.2/1.3"},
        {"port": 22, "protocol": "SSH", "service": "OpenSSH 8.9", "severity": "medium",
         "finding": "SSH port exposed to internet — restrict to VPN/bastion only"},
        {"port": 21, "protocol": "FTP", "service": "vsftpd 3.0.5", "severity": "high",
         "finding": "FTP service exposed — unencrypted file transfer protocol"},
        {"port": 3306, "protocol": "MySQL", "service": "MySQL 8.0.35", "severity": "critical",
         "finding": "MySQL database port exposed to internet — immediate risk of data breach"},
        {"port": 5432, "protocol": "PostgreSQL", "service": "PostgreSQL 15.4", "severity": "critical",
         "finding": "PostgreSQL database exposed — should never be internet-facing"},
        {"port": 8080, "protocol": "HTTP-Alt", "service": "Apache Tomcat/9.0", "severity": "medium",
         "finding": "Alternative HTTP port exposed — possible development/admin interface"},
        {"port": 6379, "protocol": "Redis", "service": "Redis 7.2.3", "severity": "critical",
         "finding": "Redis instance exposed without authentication — critical data exposure risk"},
        {"port": 27017, "protocol": "MongoDB", "service": "MongoDB 7.0", "severity": "critical",
         "finding": "MongoDB exposed to internet — common target for ransomware attacks"},
        {"port": 9200, "protocol": "Elasticsearch", "service": "Elasticsearch 8.11", "severity": "high",
         "finding": "Elasticsearch cluster exposed — may leak indexed data"},
        {"port": 25, "protocol": "SMTP", "service": "Postfix", "severity": "low",
         "finding": "SMTP service detected — check for open relay configuration"},
        {"port": 53, "protocol": "DNS", "service": "BIND 9.18", "severity": "low",
         "finding": "DNS service running — verify zone transfer restrictions"},
    ]

    # Always include HTTP/HTTPS, then randomly add 1-4 more services
    exposed = common_services[:2]  # HTTP + HTTPS
    additional = rng.sample(common_services[2:], k=rng.randint(1, 4))
    exposed.extend(additional)

    # Sort by severity for clarity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    exposed.sort(key=lambda s: severity_order.get(s["severity"], 5))

    return {
        "target": target,
        "services": exposed,
        "total_exposed": len(exposed),
        "critical_count": sum(1 for s in exposed if s["severity"] == "critical"),
        "high_count": sum(1 for s in exposed if s["severity"] == "high"),
        "scan_note": "Simulated scan — integrate Shodan/Censys API for production use",
        "source": "Service Scanner (Simulated)",
    }


# ─── 5. SSL Certificate Check ────────────────────────────────────────────────

def check_ssl_certificate(domain: str) -> dict:
    """Retrieve and analyse the SSL/TLS certificate for a domain.

    Uses Python's ssl module to connect and fetch the peer certificate.
    Reports issuer, validity dates, SANs, protocol version, and potential issues.
    """
    issues = []
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(10)
            s.connect((domain, 443))
            cert = s.getpeercert()
            protocol_version = s.version()

        # Parse cert fields
        subject = dict(x[0] for x in cert.get("subject", ()))
        issuer = dict(x[0] for x in cert.get("issuer", ()))
        not_before = cert.get("notBefore", "N/A")
        not_after = cert.get("notAfter", "N/A")

        # Subject Alternative Names
        sans = [entry[1] for entry in cert.get("subjectAltName", ())]

        # Check expiry
        try:
            expiry = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
            days_remaining = (expiry - datetime.now()).days
            if days_remaining < 0:
                issues.append({"severity": "critical", "issue": f"Certificate EXPIRED {abs(days_remaining)} days ago"})
            elif days_remaining < 30:
                issues.append({"severity": "high", "issue": f"Certificate expires in {days_remaining} days"})
            elif days_remaining < 90:
                issues.append({"severity": "medium", "issue": f"Certificate expires in {days_remaining} days"})
        except Exception:
            days_remaining = -1

        # Check for weak protocols
        if protocol_version and "TLSv1.0" in protocol_version:
            issues.append({"severity": "high", "issue": "Using deprecated TLS 1.0"})
        if protocol_version and "TLSv1.1" in protocol_version:
            issues.append({"severity": "high", "issue": "Using deprecated TLS 1.1"})

        # Check for wildcard
        if any("*" in san for san in sans):
            issues.append({"severity": "low", "issue": "Wildcard certificate in use"})

        return {
            "domain": domain,
            "subject_cn": subject.get("commonName", "N/A"),
            "issuer_org": issuer.get("organizationName", "N/A"),
            "issuer_cn": issuer.get("commonName", "N/A"),
            "valid_from": not_before,
            "valid_until": not_after,
            "days_remaining": days_remaining,
            "protocol_version": protocol_version or "N/A",
            "sans": sans[:10],
            "san_count": len(sans),
            "issues": issues,
            "source": "SSL/TLS",
        }
    except Exception as e:
        return {
            "domain": domain,
            "error": str(e),
            "issues": [{"severity": "medium", "issue": f"Could not connect: {str(e)[:80]}"}],
            "source": "SSL/TLS",
        }


# ─── 6. Risk Score Computation ────────────────────────────────────────────────

def compute_risk_score(findings_json: str) -> dict:
    """Compute an overall risk score (0-100) from aggregated OSINT findings.

    Scoring rubric:
      • Critical finding: +20 points each
      • High finding:     +12 points each
      • Medium finding:   + 6 points each
      • Low finding:      + 2 points each
      • Info finding:     + 0 points

    Categories scored: exposed services, SSL issues, DNS misconfigurations,
    WHOIS red flags, GitHub information exposure.
    """
    try:
        findings = json.loads(findings_json) if isinstance(findings_json, str) else findings_json
    except Exception:
        findings = {}

    severity_weights = {"critical": 20, "high": 12, "medium": 6, "low": 2, "info": 0}
    category_scores = {}
    category_findings = {}
    total_score = 0

    # Score exposed services
    services = findings.get("services", {})
    if isinstance(services, dict):
        svc_list = services.get("services", [])
    elif isinstance(services, list):
        svc_list = services
    else:
        svc_list = []

    svc_score = 0
    svc_details = []
    for svc in svc_list:
        sev = svc.get("severity", "info")
        pts = severity_weights.get(sev, 0)
        svc_score += pts
        if pts > 0:
            svc_details.append({"finding": svc.get("finding", ""), "severity": sev, "points": pts})
    category_scores["exposed_services"] = min(svc_score, 100)
    category_findings["exposed_services"] = svc_details

    # Score SSL issues
    ssl_data = findings.get("ssl", {})
    ssl_issues = ssl_data.get("issues", []) if isinstance(ssl_data, dict) else []
    ssl_score = 0
    ssl_details = []
    for issue in ssl_issues:
        sev = issue.get("severity", "info")
        pts = severity_weights.get(sev, 0)
        ssl_score += pts
        if pts > 0:
            ssl_details.append({"finding": issue.get("issue", ""), "severity": sev, "points": pts})
    category_scores["ssl_tls"] = min(ssl_score, 100)
    category_findings["ssl_tls"] = ssl_details

    # Score WHOIS red flags
    whois_data = findings.get("whois", {})
    whois_score = 0
    whois_details = []
    if isinstance(whois_data, dict) and not whois_data.get("error"):
        # Recently created domains are higher risk
        creation = whois_data.get("creation_date", "")
        if creation and creation != "N/A":
            try:
                created = datetime.fromisoformat(str(creation).replace(" ", "T").split(".")[0])
                age_days = (datetime.now() - created).days
                if age_days < 90:
                    whois_score += 12
                    whois_details.append({"finding": f"Domain created only {age_days} days ago", "severity": "high", "points": 12})
                elif age_days < 365:
                    whois_score += 6
                    whois_details.append({"finding": f"Domain less than 1 year old ({age_days} days)", "severity": "medium", "points": 6})
            except Exception:
                pass
        # Privacy-protected WHOIS
        registrant = whois_data.get("registrant_org", "")
        if registrant and any(kw in str(registrant).lower() for kw in ["privacy", "proxy", "redacted", "protected"]):
            whois_score += 2
            whois_details.append({"finding": "WHOIS registrant info is privacy-protected", "severity": "low", "points": 2})
    category_scores["whois"] = min(whois_score, 100)
    category_findings["whois"] = whois_details

    # Score GitHub exposure
    github_data = findings.get("github", {})
    gh_score = 0
    gh_details = []
    if isinstance(github_data, dict):
        repos = github_data.get("repos", [])
        if len(repos) > 20:
            gh_score += 6
            gh_details.append({"finding": f"Large public repo footprint ({len(repos)} repos)", "severity": "medium", "points": 6})
        for repo in repos[:10]:
            if repo.get("has_wiki"):
                gh_score += 1
            if repo.get("open_issues", 0) > 50:
                gh_score += 2
                gh_details.append({"finding": f"Repo {repo['name']} has {repo['open_issues']} open issues", "severity": "low", "points": 2})
    category_scores["github"] = min(gh_score, 100)
    category_findings["github"] = gh_details

    # Compute total (weighted average across categories, capped at 100)
    active_categories = {k: v for k, v in category_scores.items() if v > 0}
    if active_categories:
        total_score = min(sum(active_categories.values()), 100)
    else:
        total_score = 0

    # Risk level
    if total_score >= 75:
        risk_level = "Critical"
    elif total_score >= 50:
        risk_level = "High"
    elif total_score >= 25:
        risk_level = "Medium"
    elif total_score > 0:
        risk_level = "Low"
    else:
        risk_level = "Info"

    return {
        "overall_score": total_score,
        "risk_level": risk_level,
        "category_scores": category_scores,
        "category_findings": category_findings,
        "max_possible": 100,
        "source": "Risk Engine",
    }


# ─── Tool Registry ───────────────────────────────────────────────────────────

OSINT_TOOLS = {
    "search_github_repos":    search_github_repos,
    "whois_lookup":           whois_lookup,
    "dns_resolve":            dns_resolve,
    "scan_exposed_services":  scan_exposed_services,
    "check_ssl_certificate":  check_ssl_certificate,
    "compute_risk_score":     compute_risk_score,
}
