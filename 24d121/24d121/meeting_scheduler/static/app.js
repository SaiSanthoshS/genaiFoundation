const $ = id => document.getElementById(id);
const calendarBoard = $('calendar_board');
const slotsEl = $('slots');
const previewEl = $('preview');
const statusEl = $('send_status');

function buildRequestPayload() {
  return {
    participant_emails: $('emails').value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean),
    duration_minutes: Number($('duration').value) || 30,
    requester_timezone: $('timezone').value.trim() || 'UTC',
    preferred_window_start: $('window_start').value.trim() || '09:00',
    preferred_window_end: $('window_end').value.trim() || '17:00',
  };
}

function parseIso(value) {
  return value ? new Date(value) : null;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function findRange(payload) {
  const times = [];

  payload.participant_profiles.forEach(profile => {
    profile.busy_windows.forEach(([start, end]) => {
      const s = parseIso(start);
      const e = parseIso(end);
      if (s && e) {
        times.push(s, e);
      }
    });
  });

  payload.slot_options.forEach(slot => {
    const s = parseIso(slot.start_utc);
    const e = parseIso(slot.end_utc);
    if (s && e) {
      times.push(s, e);
    }
  });

  if (!times.length) {
    const now = new Date();
    times.push(now, new Date(now.getTime() + 8 * 60 * 60 * 1000));
  }

  const minTime = new Date(Math.min(...times));
  const maxTime = new Date(Math.max(...times));
  minTime.setMinutes(0, 0, 0, 0);
  maxTime.setHours(maxTime.getHours() + 1, 0, 0, 0);

  return { start: minTime, end: maxTime, minutes: (maxTime - minTime) / 60000 };
}

function clearBoard() {
  calendarBoard.innerHTML = '';
}

function buildCalendar(payload) {
  clearBoard();
  const { start, minutes: totalMinutes } = findRange(payload);

  payload.participant_profiles.forEach(profile => {
    const row = document.createElement('div');
    row.className = 'timeline-row';
    row.dataset.label = profile.email;

    const grid = document.createElement('div');
    grid.className = 'time-grid';
    for (let i = 0; i < 12; i += 1) {
      const cell = document.createElement('span');
      grid.appendChild(cell);
    }
    row.appendChild(grid);

    profile.busy_windows.forEach(([startText, endText]) => {
      const startTime = parseIso(startText);
      const endTime = parseIso(endText);
      if (!startTime || !endTime) return;
      const left = ((startTime - start) / 60000 / totalMinutes) * 100;
      const width = ((endTime - startTime) / 60000 / totalMinutes) * 100;
      const bar = document.createElement('div');
      bar.className = 'timeline-bar busy';
      bar.style.left = `${left}%`;
      bar.style.width = `${Math.max(width, 5)}%`;
      bar.textContent = `${formatTime(startTime)}–${formatTime(endTime)}`;
      row.appendChild(bar);
    });

    payload.slot_options.slice(0, 3).forEach((slot, index) => {
      const startTime = parseIso(slot.start_utc);
      const endTime = parseIso(slot.end_utc);
      if (!startTime || !endTime) return;
      const left = ((startTime - start) / 60000 / totalMinutes) * 100;
      const width = ((endTime - startTime) / 60000 / totalMinutes) * 100;
      const bar = document.createElement('div');
      bar.className = 'timeline-bar slot';
      bar.style.left = `${left}%`;
      bar.style.width = `${Math.max(width, 5)}%`;
      bar.textContent = `Slot ${index + 1}`;
      row.appendChild(bar);
    });

    calendarBoard.appendChild(row);
  });
}

function renderSlotCards(payload) {
  if (!payload.slot_options || payload.slot_options.length === 0) {
    return '<p>No slot recommendations yet. Try refreshing.</p>';
  }

  return payload.slot_options
    .slice(0, 3)
    .map((slot, index) => {
      const attendeeTimes = Object.entries(slot.participant_local_times || {})
        .map(([email, local]) => `<div class="slot-meta"><strong>${email}</strong><span>${local}</span></div>`)
        .join('');

      return `
        <div class="slot-card">
          <h4>Option ${index + 1}</h4>
          <p><strong>UTC</strong> ${slot.start_utc} → ${slot.end_utc}</p>
          <p><strong>Score</strong> ${slot.score.toFixed(2)}</p>
          <div class="slot-meta-list">${attendeeTimes}</div>
        </div>
      `;
    })
    .join('');
}

function renderInvite(payload) {
  if (!payload.invite_draft) {
    return 'No invite draft available yet. Generate slots first.';
  }

  return `Subject: ${payload.invite_draft.subject}\n\n${payload.invite_draft.body}\n\nAttendees:\n${payload.invite_draft.attendees.join('\n')}`;
}

async function postData(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Server error');
  }
  return response.json();
}

async function findSlots() {
  statusEl.textContent = 'Analyzing availability...';
  clearBoard();
  slotsEl.innerHTML = '<p>Loading top picks...</p>';
  previewEl.textContent = 'Loading invite preview...';

  try {
    const payload = buildRequestPayload();
    if (!payload.participant_emails.length) {
      throw new Error('Enter at least one participant email.');
    }

    const result = await postData('/plan', payload);
    buildCalendar(result);
    slotsEl.innerHTML = renderSlotCards(result);
    previewEl.textContent = renderInvite(result);
    statusEl.textContent = 'Top slots are ready. Review and send the invite.';
  } catch (error) {
    clearBoard();
    slotsEl.innerHTML = '';
    previewEl.textContent = '';
    statusEl.textContent = `Error: ${error.message}`;
  }
}

async function sendInvite() {
  statusEl.textContent = 'Sending invite...';
  try {
    const payload = buildRequestPayload();
    const result = await postData('/send', payload);
    statusEl.textContent = `Invite sent successfully. Event: ${result.invite_draft.conference_link || 'created'}`;
  } catch (error) {
    statusEl.textContent = `Send failed: ${error.message}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('find_button').addEventListener('click', findSlots);
  $('send_button').addEventListener('click', sendInvite);
  findSlots();
});