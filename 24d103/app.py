from flask import Flask, render_template, request
from agent import medication_agent

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():

    medication = {
        "name": request.form["name"],
        "dosage": request.form["dosage"],
        "frequency": request.form["frequency"],
        "stock": request.form["stock"],
        "doses_per_day": request.form["doses"]
    }

    report = medication_agent([medication])

    return render_template(
        "dashboard.html",
        report=report
    )


if __name__ == "__main__":
    app.run(debug=True)