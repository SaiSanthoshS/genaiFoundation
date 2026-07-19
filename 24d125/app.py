"""Gradio app for the Epidemic Spread Simulator prototype."""

from __future__ import annotations

from typing import Any

import gradio as gr

from epidemic_simulator import (
    DEFAULT_DISEASE,
    DEFAULT_INTERVENTION_DAY,
    DEFAULT_REGION,
    DEFAULT_VACCINE_RATE,
    SIMULATION_DAYS,
    default_day,
    get_region_options,
    normalize_intervention_day,
    normalize_vaccine_rate,
    render_current_map,
    render_sir_chart,
    run_simulation,
    summarize_simulation,
)


def _empty_state() -> dict[str, Any]:
    return {}


def _load_simulation(disease: str, region: str, vaccine_rate: float, intervention_day: int) -> tuple[dict[str, Any], Any, Any, Any, Any, str]:
    vaccine_rate = normalize_vaccine_rate(vaccine_rate)
    intervention_day = normalize_intervention_day(intervention_day)
    simulation = run_simulation(disease, region, vaccine_rate, intervention_day)
    day = default_day(simulation)
    map_figure = render_current_map(simulation, "Vaccination", day)
    sir_figure = render_sir_chart(simulation)
    table = simulation["comparison_table"]
    summary = summarize_simulation(simulation)
    return simulation, map_figure, sir_figure, table, gr.update(value=day, maximum=SIMULATION_DAYS - 1), summary


def _update_map(simulation: dict[str, Any], scenario_name: str, day: int) -> Any:
    if not simulation:
        return gr.update()
    day = max(0, min(int(day), SIMULATION_DAYS - 1))
    scenario_name = scenario_name if scenario_name in simulation["scenarios"].keys() else "Vaccination"
    return render_current_map(simulation, scenario_name, day)


def build_app() -> gr.Blocks:
    region_options = get_region_options()
    default_region = DEFAULT_REGION if DEFAULT_REGION in region_options else region_options[0]

    with gr.Blocks(title="Epidemic Spread Simulator", theme=gr.themes.Soft()) as demo:
        gr.Markdown(
            "# Epidemic Spread Simulator\n"
            "Select a disease and region, calibrate the model to historical case data, and compare no-action, mask, and vaccination scenarios."
        )

        simulation_state = gr.State(_empty_state())

        with gr.Row():
            with gr.Column(scale=1, min_width=320):
                disease = gr.Dropdown(
                    label="Disease",
                    choices=[DEFAULT_DISEASE],
                    value=DEFAULT_DISEASE,
                    interactive=True,
                )
                region = gr.Dropdown(
                    label="Region",
                    choices=region_options,
                    value=default_region,
                    interactive=True,
                )
                vaccine_rate = gr.Slider(
                    minimum=0.0,
                    maximum=0.05,
                    value=DEFAULT_VACCINE_RATE,
                    step=0.001,
                    label="Vaccine rate per day",
                )
                intervention_day = gr.Slider(
                    minimum=0,
                    maximum=SIMULATION_DAYS - 1,
                    value=DEFAULT_INTERVENTION_DAY,
                    step=1,
                    label="Intervention day",
                )
                scenario_view = gr.Dropdown(
                    label="Map scenario",
                    choices=["No action", "Masks", "Vaccination"],
                    value="Vaccination",
                    interactive=True,
                )
                run_button = gr.Button("Run Simulation", variant="primary")
                status = gr.Markdown("Simulation not yet run.")

            with gr.Column(scale=2, min_width=640):
                map_plot = gr.Plot(label="Animated Spread Map")
                day_scrubber = gr.Slider(
                    minimum=0,
                    maximum=SIMULATION_DAYS - 1,
                    value=default_day({"intervention_day": DEFAULT_INTERVENTION_DAY}),
                    step=1,
                    label="Day scrubber",
                )
                sir_plot = gr.Plot(label="SIR Curve Chart")
                comparison_table = gr.Dataframe(
                    label="Scenario Comparison Table",
                    headers=["Scenario", "Peak Cases", "Peak Day", "Total Affected", "Final Recovered", "Final Vaccinated", "Growth Fit Error"],
                    datatype=["str", "number", "number", "number", "number", "number", "number"],
                    interactive=False,
                )

        def run_and_store(disease_value: str, region_value: str, vaccine_value: float, intervention_value: int):
            simulation, map_figure, sir_figure, table, day_update, summary = _load_simulation(
                disease_value,
                region_value,
                vaccine_value,
                intervention_value,
            )
            return simulation, map_figure, sir_figure, table, day_update, summary

        run_button.click(
            fn=run_and_store,
            inputs=[disease, region, vaccine_rate, intervention_day],
            outputs=[simulation_state, map_plot, sir_plot, comparison_table, day_scrubber, status],
        )

        disease.change(
            fn=run_and_store,
            inputs=[disease, region, vaccine_rate, intervention_day],
            outputs=[simulation_state, map_plot, sir_plot, comparison_table, day_scrubber, status],
        )
        region.change(
            fn=run_and_store,
            inputs=[disease, region, vaccine_rate, intervention_day],
            outputs=[simulation_state, map_plot, sir_plot, comparison_table, day_scrubber, status],
        )
        vaccine_rate.change(
            fn=run_and_store,
            inputs=[disease, region, vaccine_rate, intervention_day],
            outputs=[simulation_state, map_plot, sir_plot, comparison_table, day_scrubber, status],
        )
        intervention_day.change(
            fn=run_and_store,
            inputs=[disease, region, vaccine_rate, intervention_day],
            outputs=[simulation_state, map_plot, sir_plot, comparison_table, day_scrubber, status],
        )

        scenario_view.change(
            fn=_update_map,
            inputs=[simulation_state, scenario_view, day_scrubber],
            outputs=[map_plot],
        )
        day_scrubber.change(
            fn=_update_map,
            inputs=[simulation_state, scenario_view, day_scrubber],
            outputs=[map_plot],
        )

        demo.load(
            fn=run_and_store,
            inputs=[disease, region, vaccine_rate, intervention_day],
            outputs=[simulation_state, map_plot, sir_plot, comparison_table, day_scrubber, status],
        )

    return demo


if __name__ == "__main__":
    app = build_app()
    app.launch()