const { THEMES, CURATED_BOOKS } = require("./books");

function memberThemeScores(member) {
  const raw = {};
  THEMES.forEach((t) => (raw[t] = 0));
  (member.history || []).forEach((h) => {
    (h.themes || []).forEach((t) => {
      if (raw[t] !== undefined) raw[t] += h.rating;
    });
  });
  const max = Math.max(1, ...Object.values(raw));
  const norm = {};
  THEMES.forEach((t) => (norm[t] = raw[t] / max));
  return norm;
}

function groupThemeOverlap(members) {
  const active = members.filter((m) => (m.history || []).length > 0);
  const overlap = {};
  if (active.length === 0) {
    THEMES.forEach((t) => (overlap[t] = { score: 0, count: 0, coverage: 0 }));
    return overlap;
  }
  const perMember = active.map(memberThemeScores);
  THEMES.forEach((t) => {
    let sum = 0;
    let likers = 0;
    perMember.forEach((scores) => {
      sum += scores[t];
      if (scores[t] >= 0.4) likers++;
    });
    const meanScore = sum / perMember.length;
    const coverage = likers / perMember.length;
    overlap[t] = { score: meanScore * coverage, count: likers, coverage };
  });
  return overlap;
}

function rankedOverlap(members, limit = 4) {
  const overlap = groupThemeOverlap(members);
  const totalMembers = members.filter((m) => (m.history || []).length > 0).length;
  const ranked = THEMES.map((t) => ({ theme: t, ...overlap[t] }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return { ranked, totalMembers };
}

function alreadyReadTitles(members) {
  const s = new Set();
  members.forEach((m) => (m.history || []).forEach((h) => s.add(h.title.toLowerCase())));
  return s;
}

function computeRecommendations(members, limit = 6) {
  const overlap = groupThemeOverlap(members);
  const maxScore = Math.max(0.0001, ...Object.values(overlap).map((o) => o.score));
  const already = alreadyReadTitles(members);
  const active = members.filter((m) => (m.history || []).length > 0);
  const perMemberScores = active.map(memberThemeScores);

  const candidates = CURATED_BOOKS.filter((b) => !already.has(b.title.toLowerCase()));

  const scored = candidates.map((b) => {
    const themeAvg = b.themes.reduce((s, t) => s + overlap[t].score, 0) / b.themes.length;
    const themeNorm = themeAvg / maxScore;
    let coverageCount = 0;
    if (perMemberScores.length) {
      perMemberScores.forEach((scores) => {
        const likes = b.themes.some((t) => scores[t] >= 0.25);
        if (likes) coverageCount++;
      });
    }
    const coverage = perMemberScores.length ? coverageCount / perMemberScores.length : 0;
    const pct = Math.round(100 * (0.65 * Math.min(1, themeNorm) + 0.35 * coverage));
    return {
      ...b,
      matchPercent: Math.max(5, Math.min(99, pct)),
      coverageCount,
      totalMembers: perMemberScores.length
    };
  });

  scored.sort((a, b) => b.matchPercent - a.matchPercent);
  return scored.slice(0, limit);
}

function buildSchedule(selection) {
  const start = new Date(selection.startDate + "T00:00:00");
  const end = new Date(selection.meetingDate + "T00:00:00");
  let days = Math.round((end - start) / (24 * 3600 * 1000));
  if (days < 1) days = 1;
  const perDay = Math.ceil(selection.pages / days);
  const schedule = [];
  let cumulative = 0;
  for (let i = 1; i <= days; i++) {
    const d = new Date(start.getTime() + i * 24 * 3600 * 1000);
    cumulative = Math.min(selection.pages, cumulative + perDay);
    schedule.push({ date: d.toISOString().slice(0, 10), target: cumulative });
  }
  return schedule;
}

module.exports = {
  memberThemeScores,
  groupThemeOverlap,
  rankedOverlap,
  computeRecommendations,
  buildSchedule
};
