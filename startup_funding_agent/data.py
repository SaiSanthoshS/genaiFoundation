# Mock data for the Startup Funding Intelligence Agent

funding_rounds = [
    {
        "startup_sector": "SaaS",
        "stage": "Seed",
        "rounds": [
            {"year": 2023, "round": "Pre-Seed", "amount": "$750K", "lead": "Apex Ventures"},
            {"year": 2024, "round": "Seed", "amount": "$2.2M", "lead": "Orbit Capital"},
        ],
    },
    {
        "startup_sector": "HealthTech",
        "stage": "Series A",
        "rounds": [
            {"year": 2024, "round": "Seed", "amount": "$3.1M", "lead": "Novo Fund"},
            {"year": 2025, "round": "Series A", "amount": "$12M", "lead": "Pulse Ventures"},
        ],
    },
    {
        "startup_sector": "FinTech",
        "stage": "Series B",
        "rounds": [
            {"year": 2023, "round": "Series A", "amount": "$18M", "lead": "Ledger Partners"},
            {"year": 2025, "round": "Series B", "amount": "$45M", "lead": "Frame Capital"},
        ],
    },
]

investors = [
    {
        "name": "Orbit Capital",
        "focus": ["SaaS", "AI", "B2B"],
        "stage_focus": ["Pre-Seed", "Seed", "Series A"],
        "portfolio": ["PipelineFlow", "SecureDesk", "EmbedAI"],
        "latest_news": "Orbit Capital closed a $500M fund focused on enterprise SaaS and AI infrastructure.",
        "contact": "https://example.com/contact/orbit-capital",
    },
    {
        "name": "Pulse Ventures",
        "focus": ["HealthTech", "BioTech", "AI"],
        "stage_focus": ["Seed", "Series A", "Series B"],
        "portfolio": ["MediApps", "CareRoute", "NeuroSense"],
        "latest_news": "Pulse Ventures announced a strategic partnership with a leading health data exchange.",
        "contact": "https://example.com/contact/pulse-ventures",
    },
    {
        "name": "Frame Capital",
        "focus": ["FinTech", "Payments", "RegTech"],
        "stage_focus": ["Series A", "Series B", "Growth"],
        "portfolio": ["Transactly", "SafeBank", "CreditMesh"],
        "latest_news": "Frame Capital led a $60M round for a next-gen payments startup.",
        "contact": "https://example.com/contact/frame-capital",
    },
    {
        "name": "Apex Ventures",
        "focus": ["AI", "DeepTech", "SaaS"],
        "stage_focus": ["Pre-Seed", "Seed"],
        "portfolio": ["QuantumLeap", "DataBridge", "VisionaryAI"],
        "latest_news": "Apex Ventures expanded its early-stage climate tech portfolio this quarter.",
        "contact": "https://example.com/contact/apex-ventures",
    },
]

investor_news = [
    {
        "date": "2026-07-12",
        "headline": "Orbit Capital launches a dedicated AI SaaS growth fund.",
        "source": "TechCrunch",
    },
    {
        "date": "2026-07-09",
        "headline": "Pulse Ventures backs new HealthTech startup focused on remote diagnostics.",
        "source": "Crunchbase News",
    },
    {
        "date": "2026-07-10",
        "headline": "Frame Capital invests in a Series B fintech security platform.",
        "source": "VentureBeat",
    },
    {
        "date": "2026-07-11",
        "headline": "Apex Ventures closes first check on five AI startups this year.",
        "source": "Forbes",
    },
]
