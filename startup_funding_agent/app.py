import gradio as gr

from .analysis import get_funding_timeline, score_investors, generate_weekly_digest, recent_investor_news


def analyze_startup(name: str, sector: str, stage: str, revenue_range: str, subscribe: bool):
    timeline = get_funding_timeline(sector, stage)
    investors = score_investors(sector, stage, revenue_range)
    digest = generate_weekly_digest(name, sector, stage, revenue_range)
    subscription_status = "Subscribed to weekly digest" if subscribe else "Not subscribed"

    timeline_table = "\n".join([
        f"{item['year']} | {item['round']} | {item['amount']} | Lead: {item['lead']}" for item in timeline
    ])

    investor_rows = []
    for inv in investors:
        investor_rows.append(
            [inv["name"], inv["score"], inv["focus"], inv["stage_focus"], inv["portfolio"], inv["latest_news"], inv["contact"], inv["fit_tags"]]
        )

    return timeline_table, investor_rows, digest, subscription_status


def build_ui():
    with gr.Blocks(title="Startup Funding Intelligence Agent") as demo:
        gr.Markdown("# Startup Funding Intelligence Agent")
        with gr.Row():
            with gr.Column(scale=1):
                name = gr.Textbox(label="Startup Name", placeholder="e.g. NovaHealth")
                sector = gr.Textbox(label="Sector", placeholder="e.g. HealthTech")
                stage = gr.Dropdown(label="Stage", choices=["Pre-Seed", "Seed", "Series A", "Series B", "Growth"], value="Seed")
                revenue_range = gr.Dropdown(label="Revenue Range", choices=["<$1M", "$1M-$5M", "$5M-$20M", ">$20M"], value="<$1M")
                subscribe = gr.Checkbox(label="Subscribe to weekly digest preview")
                analyze_btn = gr.Button("Analyse")
            with gr.Column(scale=2):
                gr.Markdown("### Funding Timeline")
                timeline_output = gr.Textbox(label="Funding Timeline", lines=6, interactive=False)
                gr.Markdown("### Investor Match Table")
                investor_table = gr.Dataframe(
                    headers=["Investor", "Fit Score", "Focus", "Stage Focus", "Portfolio", "Latest News", "Contact", "Fit Tags"],
                    datatype=["str", "int", "str", "str", "str", "str", "str", "str"],
                    interactive=False,
                    
                )
                gr.Markdown("### Weekly Digest Preview")
                digest_output = gr.Textbox(label="Weekly Digest", lines=14, interactive=False)
                status_output = gr.Textbox(label="Subscription Status", interactive=False)

        analyze_btn.click(
            analyze_startup,
            inputs=[name, sector, stage, revenue_range, subscribe],
            outputs=[timeline_output, investor_table, digest_output, status_output],
        )

        with gr.Accordion("Recent Investor News", open=False):
            news = recent_investor_news()
            for item in news:
                gr.Markdown(f"- **{item['date']}**: {item['headline']} ({item['source']})")

    return demo


if __name__ == "__main__":
    demo = build_ui()
    demo.launch(server_name="0.0.0.0", server_port=7860, share=True)
