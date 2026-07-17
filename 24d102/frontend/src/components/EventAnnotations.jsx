export default function EventAnnotations({ annotations }) {
  return (
    <section className="panel events-panel">
      <h2>Economic Event Annotations</h2>
      <p className="subtext">
        Markers are linked to visible inflections. Hover-like detail is shown as text below.
      </p>

      {!annotations.length ? (
        <p className="empty-note">No significant inflection points were found in the selected range.</p>
      ) : (
        <ul className="event-list">
          {annotations.map((event) => (
            <li key={`${event.date}-${event.title}`}>
              <p className="event-head">
                <span>{event.date}</span>
                <strong>{event.title}</strong>
                <em>{event.pctChange}% daily move</em>
              </p>
              <p>{event.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
