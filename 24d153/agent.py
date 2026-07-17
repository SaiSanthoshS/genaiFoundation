"""
OSINT ReAct Agent
=================
Gemini-powered agent that orchestrates OSINT reconnaissance tools using the
ReAct (Reason + Act) loop pattern from the Advanced Module.

The agent:
  1. Receives a domain/org target and scope
  2. Iteratively calls OSINT tools (GitHub, WHOIS, DNS, Services, SSL)
  3. Aggregates findings and computes a risk score
  4. Produces a structured intelligence report
"""

import os, json, re, time, getpass
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types

from tools import OSINT_TOOLS

# ─── Setup ────────────────────────────────────────────────────────────────────

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

gemini_api_key = os.environ.get('GEMINI_API_KEY')
if not gemini_api_key:
    gemini_api_key = getpass.getpass('Paste your Gemini API key: ')

gemini_client = genai.Client(api_key=gemini_api_key)
GEMINI_MODEL = 'gemini-3.1-flash-lite'
DEFAULT_MAX_OUTPUT_TOKENS = 4096


def make_generation_config(**kwargs):
    """Build a GenerateContentConfig with sensible defaults."""
    kwargs.setdefault('max_output_tokens', DEFAULT_MAX_OUTPUT_TOKENS)
    kwargs.setdefault('temperature', 0.2)
    return types.GenerateContentConfig(**kwargs)


def extract_text_from_response(response) -> str:
    """Pull the final answer text from a Gemini response, skipping reasoning thoughts."""
    if response.text:
        return response.text.strip()
    text_parts = []
    for candidate in (response.candidates or []):
        if candidate.content:
            for part in candidate.content.parts:
                if not getattr(part, 'thought', False) and part.text:
                    text_parts.append(part.text)
    return ''.join(text_parts).strip()


def call_with_retry(api_function, *args, max_retries=5, **kwargs):
    """Wrap an API call with automatic retry for rate-limit and server errors."""
    for attempt in range(max_retries):
        try:
            return api_function(*args, **kwargs)
        except Exception as error:
            error_message = str(error)
            if '429' in error_message or 'RESOURCE_EXHAUSTED' in error_message:
                retry_wait_match = re.search(r'retry[^0-9]*([0-9]+)s', error_message, re.I)
                wait_seconds = int(retry_wait_match.group(1)) + 5 if retry_wait_match else 35
                print(f'  ⏳ Rate-limited — waiting {wait_seconds}s')
                time.sleep(wait_seconds)
            elif '500' in error_message or 'INTERNAL' in error_message:
                time.sleep(10 * (attempt + 1))
            else:
                raise
    raise RuntimeError('Max retries exceeded')


# Wrap Gemini client for automatic retries
_original_generate = gemini_client.models.generate_content
gemini_client.models.generate_content = lambda *args, **kwargs: call_with_retry(_original_generate, *args, **kwargs)


# ─── Tool Schema ──────────────────────────────────────────────────────────────

osint_tool_schema = types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name='search_github_repos',
        description='Search GitHub for public repositories belonging to an organization or user. Returns repo names, descriptions, languages, stars, forks, and URLs.',
        parameters=types.Schema(type=types.Type.OBJECT, required=['target'],
            properties={
                'target': types.Schema(type=types.Type.STRING, description='Organization name or username to search on GitHub'),
            })
    ),
    types.FunctionDeclaration(
        name='whois_lookup',
        description='Fetch WHOIS registration records for a domain. Returns registrar, creation/expiry dates, nameservers, registrant organization, and domain status.',
        parameters=types.Schema(type=types.Type.OBJECT, required=['domain'],
            properties={
                'domain': types.Schema(type=types.Type.STRING, description='Domain name to look up, e.g. example.com'),
            })
    ),
    types.FunctionDeclaration(
        name='dns_resolve',
        description='Resolve DNS records (A, AAAA, MX, NS, TXT, CNAME, SOA) for a domain. Shows where the domain points and mail configuration.',
        parameters=types.Schema(type=types.Type.OBJECT, required=['domain'],
            properties={
                'domain': types.Schema(type=types.Type.STRING, description='Domain name to resolve DNS records for'),
            })
    ),
    types.FunctionDeclaration(
        name='scan_exposed_services',
        description='Scan for exposed services and open ports on a target domain. Identifies potentially dangerous internet-facing services like databases, SSH, FTP.',
        parameters=types.Schema(type=types.Type.OBJECT, required=['target'],
            properties={
                'target': types.Schema(type=types.Type.STRING, description='Domain or IP address to scan for exposed services'),
            })
    ),
    types.FunctionDeclaration(
        name='check_ssl_certificate',
        description='Retrieve and analyze the SSL/TLS certificate for a domain. Reports issuer, validity dates, protocol version, Subject Alternative Names, and potential issues.',
        parameters=types.Schema(type=types.Type.OBJECT, required=['domain'],
            properties={
                'domain': types.Schema(type=types.Type.STRING, description='Domain name to check SSL certificate for'),
            })
    ),
    types.FunctionDeclaration(
        name='compute_risk_score',
        description='Compute an overall risk score (0-100) from aggregated OSINT findings. Pass all collected findings as a JSON string with keys: services, ssl, whois, github, dns.',
        parameters=types.Schema(type=types.Type.OBJECT, required=['findings_json'],
            properties={
                'findings_json': types.Schema(type=types.Type.STRING, description='JSON string containing all collected findings to score'),
            })
    ),
])


# ─── System Prompt ────────────────────────────────────────────────────────────

OSINT_SYSTEM_PROMPT = """You are an expert OSINT (Open Source Intelligence) analyst specializing in domain and organization reconnaissance.

Your mission: Given a target domain or organization name, systematically enumerate all available public intelligence and compile a comprehensive security exposure report.

## Investigation Protocol

1. **GitHub Reconnaissance**: Search for the organization's public repositories to identify code exposure, technology stack, and potential information leaks.
2. **WHOIS Intelligence**: Look up domain registration records to identify registrar, creation dates, registrant organization, and nameservers.
3. **DNS Enumeration**: Resolve all DNS record types to map the domain's infrastructure — mail servers, nameservers, TXT verification records, IP addresses.
4. **Service Scanning**: Scan for exposed services and open ports to identify potentially dangerous internet-facing services.
5. **SSL/TLS Analysis**: Check the SSL certificate for validity, issuer, expiration, and protocol version issues.
6. **Risk Assessment**: After collecting all findings, aggregate them into the compute_risk_score tool to generate an overall risk score.

## Rules
- Run ALL applicable tools based on the scope provided. Do not skip any tool in scope.
- Call tools one category at a time and analyze results before proceeding.
- After all scans complete, ALWAYS call compute_risk_score with all findings aggregated as a JSON string.
- In your final report, structure findings by category with severity ratings.
- Be specific about security implications — explain WHY each finding matters.
- Include actionable remediation recommendations for critical and high findings.

## Final Report Format
Produce a structured report with these sections:
1. **Executive Summary** — 2-3 sentence overview
2. **Target Information** — domain, org, scan timestamp
3. **Findings by Category** — GitHub, WHOIS, DNS, Services, SSL
4. **Risk Score** — overall score and breakdown
5. **Critical Recommendations** — top 3-5 actionable items
"""


# ─── Agent Runner ─────────────────────────────────────────────────────────────

def run_osint_agent(
    target: str,
    scopes: list = None,
    max_steps: int = 15,
    progress_callback=None,
) -> dict:
    """Run the OSINT agent against a target domain/org.

    Args:
        target: Domain name or organization name to investigate
        scopes: List of scopes to investigate (github, whois, dns, services, ssl)
        max_steps: Maximum ReAct loop iterations
        progress_callback: Optional callable(step, tool_name, result) for live updates

    Returns:
        Dict with: report (str), findings (dict), risk_score (dict), steps (list)
    """
    if scopes is None:
        scopes = ['github', 'whois', 'dns', 'services', 'ssl']

    scope_text = ', '.join(scopes)
    task = (
        f"Investigate the target: {target}\n"
        f"Scopes to investigate: {scope_text}\n"
        f"Run all tools for the scopes listed above, then compute the risk score and produce a full intelligence report."
    )

    conversation = [
        types.Content(role='user', parts=[types.Part(
            text=f'[SYSTEM]: {OSINT_SYSTEM_PROMPT}\n\n[USER TASK]: {task}'
        )])
    ]

    steps_log = []
    all_findings = {}
    total_tokens = 0

    if progress_callback:
        progress_callback("start", "agent", {"target": target, "scopes": scopes})

    for step_number in range(1, max_steps + 1):
        llm_response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=conversation,
            config=make_generation_config(tools=[osint_tool_schema], temperature=0.2)
        )
        total_tokens += llm_response.usage_metadata.total_token_count

        # Check for function calls
        all_function_calls = [
            part.function_call
            for part in llm_response.candidates[0].content.parts
            if hasattr(part, 'function_call') and part.function_call
        ]

        if not all_function_calls:
            # Final answer — the report
            final_answer = extract_text_from_response(llm_response)
            steps_log.append({
                "step": step_number,
                "type": "final_answer",
                "content": final_answer[:200] + "..." if len(final_answer) > 200 else final_answer,
            })
            if progress_callback:
                progress_callback("complete", "agent", {"steps": step_number, "tokens": total_tokens})

            return {
                "report": final_answer,
                "findings": all_findings,
                "steps": steps_log,
                "total_steps": step_number,
                "total_tokens": total_tokens,
                "target": target,
                "scopes": scopes,
                "timestamp": datetime.now().isoformat(),
            }

        # Execute tool calls
        tool_results = []
        for function_call in all_function_calls:
            tool_name = function_call.name
            tool_args = dict(function_call.args)

            step_info = {
                "step": step_number,
                "type": "tool_call",
                "tool": tool_name,
                "args": tool_args,
            }

            if tool_name not in OSINT_TOOLS:
                result = {"error": f"Unknown tool: {tool_name}"}
                tool_results.append(result)
                step_info["result"] = result
                steps_log.append(step_info)
                continue

            try:
                result = OSINT_TOOLS[tool_name](**tool_args)
                tool_results.append(result)

                # Store findings by category
                category_map = {
                    "search_github_repos": "github",
                    "whois_lookup": "whois",
                    "dns_resolve": "dns",
                    "scan_exposed_services": "services",
                    "check_ssl_certificate": "ssl",
                    "compute_risk_score": "risk_score",
                }
                category = category_map.get(tool_name, tool_name)
                all_findings[category] = result

                step_info["result_summary"] = json.dumps(result)[:200]
                steps_log.append(step_info)

                if progress_callback:
                    progress_callback("tool_result", tool_name, result)

                print(f'[Step {step_number}] 🔧 {tool_name}({tool_args})')
                print(f'           → {json.dumps(result)[:120]}')

            except Exception as error:
                result = {"error": str(error)}
                tool_results.append(result)
                step_info["error"] = str(error)
                steps_log.append(step_info)
                print(f'[Step {step_number}] ❌ {tool_name} ERROR: {error}')

        # Append conversation turns
        conversation.append(llm_response.candidates[0].content)
        conversation.append(types.Content(role='user', parts=[
            types.Part(function_response=types.FunctionResponse(
                name=fc.name,
                response={'result': res}
            ))
            for fc, res in zip(all_function_calls, tool_results)
        ]))

    return {
        "report": "Investigation reached maximum steps. Partial results available.",
        "findings": all_findings,
        "steps": steps_log,
        "total_steps": max_steps,
        "total_tokens": total_tokens,
        "target": target,
        "scopes": scopes,
        "timestamp": datetime.now().isoformat(),
    }


# ─── CLI Entry Point ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "google.com"
    print(f"\n🔍 Investigating: {target}\n")
    result = run_osint_agent(target)
    print("\n" + "=" * 70)
    print("📄 INTELLIGENCE REPORT")
    print("=" * 70)
    print(result["report"])
    print(f"\n📊 Steps: {result['total_steps']} | Tokens: {result['total_tokens']}")
