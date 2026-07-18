from flask import Flask, abort, render_template, request

app = Flask(__name__)

CVE_DB = [
    {
        "cve_id": "CVE-2024-3094",
        "software": "openssl",
        "affected_versions": ["3.0.0", "3.0.12"],
        "base_severity": 9.8,
        "summary": "A buffer overflow in OpenSSL could allow remote code execution when the library is exposed to untrusted input.",
        "patch": "Upgrade to OpenSSL 3.0.13+ or 3.1.5+.",
        "link": "https://www.cve.org/CVERecord?id=CVE-2024-3094",
    },
    {
        "cve_id": "CVE-2023-45853",
        "software": "nginx",
        "affected_versions": ["1.25.5", "1.25.0"],
        "base_severity": 7.5,
        "summary": "Nginx is vulnerable to request smuggling under certain proxy configurations.",
        "patch": "Upgrade to Nginx 1.25.6+ or 1.26.0+.",
        "link": "https://www.cve.org/CVERecord?id=CVE-2023-45853",
    },
    {
        "cve_id": "CVE-2024-21762",
        "software": "apache",
        "affected_versions": ["2.4.57"],
        "base_severity": 8.8,
        "summary": "A remote code execution issue impacts Apache HTTP Server when mod_ssl is enabled.",
        "patch": "Apply the vendor patch and move to Apache 2.4.58+.",
        "link": "https://www.cve.org/CVERecord?id=CVE-2024-21762",
    },
]


def normalize_stack(raw_text: str):
    entries = []
    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" in line:
            name, version = [part.strip() for part in line.split(":", 1)]
        else:
            name, version = line, "latest"
        entries.append({"name": name.lower(), "version": version.lower()})
    return entries


def version_matches(installed_version: str, affected_versions):
    installed_version = installed_version.lower()
    if installed_version in {"latest", "unknown", ""}:
        return True
    for affected in affected_versions:
        affected = affected.lower()
        if installed_version == affected or installed_version.startswith(affected):
            return True
    return False


def match_cves(stack_entries, exposed_to_internet: bool, severity_threshold: float):
    alerts = []
    for entry in stack_entries:
        for cve in CVE_DB:
            if cve["software"].lower() != entry["name"]:
                continue
            if not version_matches(entry["version"], cve["affected_versions"]):
                continue

            exposure_bonus = 1.0 if exposed_to_internet else 0.2
            severity_score = round(min(10.0, cve["base_severity"] + exposure_bonus), 1)
            if severity_score < severity_threshold:
                continue

            if severity_score >= 9.0:
                priority = "Critical"
                patch_priority = "Immediate patch"
            elif severity_score >= 7.0:
                priority = "High"
                patch_priority = "Patch within 7 days"
            elif severity_score >= 4.0:
                priority = "Medium"
                patch_priority = "Plan patch window"
            else:
                priority = "Low"
                patch_priority = "Monitor"

            alerts.append(
                {
                    "cve_id": cve["cve_id"],
                    "software": cve["software"],
                    "installed_version": entry["version"],
                    "severity_score": severity_score,
                    "priority": priority,
                    "summary": cve["summary"],
                    "patch": cve["patch"],
                    "link": cve["link"],
                    "patch_priority": patch_priority,
                    "exposed_to_internet": exposed_to_internet,
                }
            )

    alerts.sort(key=lambda item: (-item["severity_score"], item["cve_id"]))
    return alerts


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        stack_text = request.form.get("stack_text", "")
        severity_threshold = float(request.form.get("severity_threshold", 5.0))
        exposed_to_internet = bool(request.form.get("internet_exposed"))
        digest_channel = request.form.get("digest_channel", "email")
        stack_entries = normalize_stack(stack_text)
        alerts = match_cves(stack_entries, exposed_to_internet, severity_threshold)
        return render_template(
            "results.html",
            alerts=alerts,
            stack_text=stack_text,
            severity_threshold=severity_threshold,
            digest_channel=digest_channel,
            exposed_to_internet=exposed_to_internet,
        )

    return render_template(
        "index.html",
        stack_text="nginx:1.25.5\nopenssl:3.0.12\napache:2.4.57",
        severity_threshold=5.0,
        digest_channel="email",
    )


@app.route("/details/<cve_id>")
def cve_detail(cve_id: str):
    cve = next((item for item in CVE_DB if item["cve_id"].lower() == cve_id.lower()), None)
    if cve is None:
        abort(404)
    return render_template("detail.html", cve=cve)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
