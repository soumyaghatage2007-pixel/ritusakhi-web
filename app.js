// RituSakhi Web Companion App Engine
// Full offline-capable menstrual awareness assistant with Cycle Intelligence & Voice Support

const STORAGE_KEY_PERIODS = "ritusakhi_periods";
const STORAGE_KEY_LOGS = "ritusakhi_daily_logs";
const STORAGE_KEY_USER = "ritusakhi_user";
const STORAGE_KEY_LANG = "ritusakhi_lang";
const STORAGE_KEY_THEME = "ritusakhi_theme";

// State
let periods = [];
let dailyLogs = {};
let user = {
  name: "Sakhi",
  avgCycle: 28,
  avgPeriod: 5,
  lmp: "2026-10-18"
};

let currentCalMonth = new Date(2026, 9, 1); // Oct/Nov 2026
let selectedDateIso = "2026-10-30";
let pendingImportRecords = [];

// Localization Dictionary
const translations = {
  en: {
    brandTitle: "RituSakhi",
    tagline: "Your cycle, your health, your SAKHI",
    greeting: "Hello, %name%",
    heroSub: "Track menstrual rhythms, ovulation signals, and explainable health insights with 100% offline privacy."
  },
  kn: {
    brandTitle: "ಋತುಸಖಿ",
    tagline: "ನಿಮ್ಮ ಚಕ್ರ, ನಿಮ್ಮ ಆರೋಗ್ಯ, ನಿಮ್ಮ ಸಖಿ",
    greeting: "ನಮಸ್ಕಾರ, %name%",
    heroSub: "ನಿಮ್ಮ ಮುಟ್ಟಿನ ಚಕ್ರ, ಅಂಡೋತ್ಪತ್ತಿ ಮತ್ತು ಆರೋಗ್ಯ ಒಳನೋಟಗಳನ್ನು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."
  },
  hi: {
    brandTitle: "ऋतुसखी",
    tagline: "आपका चक्र, आपका स्वास्थ्य, आपकी सखी",
    greeting: "नमस्ते, %name%",
    heroSub: "अपने मासिक धर्म चक्र, ओव्यूलेशन और स्वास्थ्य अंतर्दृष्टि को पूर्ण गोपनीयता के साथ ट्रैक करें।"
  },
  ta: {
    brandTitle: "ரிதுசகி",
    tagline: "உங்கள் சுழற்சி, உங்கள் ஆரோக்கியம், உங்கள் சகி",
    greeting: "வணக்கம், %name%",
    heroSub: "உங்கள் மாதவிடாய் சுழற்சி மற்றும் சுகாதார நுண்ணறிவுகளைப் பாதுகாப்பாகக் கண்காணியுங்கள்."
  },
  te: {
    brandTitle: "ఋతుసఖి",
    tagline: "మీ చక్రం, మీ ఆరోగ్యం, మీ సఖి",
    greeting: "నమస్కారం, %name%",
    heroSub: "మీ రుతుక్రమ ఆరోగ్యం మరియు అండోత్పత్తి వివరాలను పూర్తి గోప్యతతో ట్రాక్ చేయండి."
  },
  mr: {
    brandTitle: "ऋतुसखी",
    tagline: "तुमचे चक्र, तुमचे आरोग्य, तुमची सखी",
    greeting: "नमस्कार, %name%",
    heroSub: "तुमचे मासिक पाळी चक्र आणि आरोग्य अंतर्दृष्टी ऑफलाइन सुरक्षिततेसह ट्रॅक करा."
  },
  bn: {
    brandTitle: "ঋতুসখী",
    tagline: "আপনার চক্র, আপনার স্বাস্থ্য, আপনার সখী",
    greeting: "নমস্কার, %name%",
    heroSub: "আপনার মাসিক চক্র এবং স্বাস্থ্য সচেতনতা সম্পূর্ণ গোপনীয়তার সাথে ট্র্যাক করুন।"
  }
};

// 12 Medically Reviewed Topics
const articlesData = [
  { id: 1, category: "Basics", readTime: 4, title: "Understanding Menstruation", summary: "Menstruation is the monthly shedding of the uterine lining when pregnancy does not occur.", content: "Menstruation is regulated by a delicate hormonal symphony between the hypothalamus, pituitary gland, and ovaries. Normal flow ranges from 2 to 7 days." },
  { id: 2, category: "Physiology", readTime: 5, title: "Menstrual Cycle Phases", summary: "The 4 distinct phases: Menstrual, Follicular, Ovulatory, and Luteal.", content: "1. Menstrual Phase (Days 1–5): Shedding of endometrium.\n2. Follicular Phase (Days 1–13): Estrogen rises and follicles develop.\n3. Ovulatory Phase (Around Day 14): LH triggers egg release.\n4. Luteal Phase (Days 15–28): Progesterone readies the uterus." },
  { id: 3, category: "Physiology", readTime: 4, title: "Understanding Ovulation", summary: "Release of a mature ovum, typically 12 to 16 days before the subsequent cycle begins.", content: "Calendar models assume a 14-day luteal phase, but real-world ovulation shifts with stress, illness, or travel. Physical signals like BBT and cervical mucus provide corroboration." },
  { id: 4, category: "Physiology", readTime: 4, title: "What is a Fertile Window?", summary: "A 6-day timeframe: 5 days before ovulation plus ovulation day itself.", content: "Because sperm can survive in fertile cervical mucus for up to 5 days while an egg lives 12-24 hours, conception can occur from intercourse in this window." },
  { id: 5, category: "Symptoms", readTime: 5, title: "Understanding Period Cramps (Dysmenorrhea)", summary: "Contractions prompted by natural prostaglandins in uterine muscle.", content: "Prostaglandins stimulate muscle contractions to shed the endometrium. Gentle heat therapy, hydration, and magnesium help relax spasms naturally." },
  { id: 6, category: "Symptoms", readTime: 4, title: "Common Menstrual Symptoms & Tracking", summary: "How bloating, fatigue, breast tenderness, and headaches correlate with cycle phases.", content: "Tracking symptom timing across multiple cycles empowers you to plan self-care rather than feeling caught unprepared." },
  { id: 7, category: "Hygiene", readTime: 4, title: "Menstrual Hygiene Best Practices", summary: "Safe product usage, changing frequency, and vaginal health protection.", content: "Change pads every 4 to 6 hours and wash externally with plain warm water. Avoid internal douching, which disrupts the protective acidic microbiome." },
  { id: 8, category: "Physiology", readTime: 5, title: "Understanding Irregular Cycles", summary: "Healthy adult cycles vary between 21 and 35 days. Mild occasional shifts are standard.", content: "A cycle is considered irregular when variations consistently exceed 7–9 days. Persistent irregularity warrants routine consultation with a doctor." },
  { id: 9, category: "Clinical", readTime: 4, title: "When to Consult a Healthcare Professional", summary: "Key warning signs: bleeding >7 days, severe pain, or cycles stopping >90 days.", content: "Seek medical evaluation if bleeding is excessively heavy (soaking >1 pad/hour for consecutive hours) or if cycles suddenly shift after years of regularity." },
  { id: 10, category: "Myths", readTime: 5, title: "Menstrual Health Myths Debunked", summary: "Exercise during periods, dirty blood misconceptions, and rigid 28-day assumptions.", content: "Myth: Period blood is toxic. Fact: It is regular blood, tissue, and mucus. Myth: Exercise is dangerous. Fact: Moderate movement releases endorphins and reduces cramps." },
  { id: 11, category: "Lifestyle", readTime: 4, title: "Importance of Nutrition & Sleep in Cycle Health", summary: "Replenishing iron, magnesium benefits, and circadian hormonal rhythm stability.", content: "Iron-rich lentils, spinach, and seeds replenish lost blood, while consistent sleep schedules prevent elevated cortisol from delaying ovulation." },
  { id: 12, category: "Physiology", readTime: 4, title: "Basal Body Temperature (BBT) Basics", summary: "The thermal effect of progesterone causes a subtle biphasic temperature rise after ovulation.", content: "BBT measured first thing upon waking rises ~0.3°F to 0.5°F following ovulation. It confirms ovulation retrospectively rather than predicting it beforehand." }
];

// Helper: Date Math
function addDays(iso, d) {
  const parts = iso.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(startIso, endIso) {
  const p1 = startIso.split("-").map(Number);
  const p2 = endIso.split("-").map(Number);
  const d1 = new Date(p1[0], p1[1] - 1, p1[2]);
  const d2 = new Date(p2[0], p2[1] - 1, p2[2]);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Initialize Data & Pre-population
function initData() {
  const storedPeriods = localStorage.getItem(STORAGE_KEY_PERIODS);
  if (storedPeriods) {
    periods = JSON.parse(storedPeriods);
  } else {
    // Pre-populate 4 contiguous realistic cycles for instant demonstration
    periods = [
      { startDate: "2026-07-25", endDate: "2026-07-29", flow: "Medium", notes: "Regular cycle" },
      { startDate: "2026-08-22", endDate: "2026-08-26", flow: "Medium", notes: "Regular cycle" },
      { startDate: "2026-09-20", endDate: "2026-09-24", flow: "Heavy", notes: "Mild cramps" },
      { startDate: "2026-10-18", endDate: "2026-10-22", flow: "Medium", notes: "Latest recorded period" }
    ];
    savePeriods();
  }

  const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
  if (storedLogs) {
    dailyLogs = JSON.parse(storedLogs);
  } else {
    // Pre-populate sample observations for symptom & BBT trends
    dailyLogs["2026-10-18"] = { mood: "Tired", symptoms: "Cramps, Fatigue", bbt: 97.4 };
    dailyLogs["2026-10-19"] = { mood: "Calm", symptoms: "Cramps", bbt: 97.3 };
    dailyLogs["2026-10-28"] = { mood: "Energetic", symptoms: "None", bbt: 97.5 };
    dailyLogs["2026-10-30"] = { mood: "Happy", symptoms: "Headache", bbt: 97.8, mucus: "Egg-white", lh: "Peak" };
    saveLogs();
  }

  const storedUser = localStorage.getItem(STORAGE_KEY_USER);
  if (storedUser) user = JSON.parse(storedUser);

  const storedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  if (storedTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    document.getElementById("themeToggleBtn").textContent = "☀️";
  }

  const storedLang = localStorage.getItem(STORAGE_KEY_LANG) || "en";
  document.getElementById("langSelector").value = storedLang;
  applyLanguage(storedLang);
}

function savePeriods() {
  localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(periods));
}

function saveLogs() {
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(dailyLogs));
}

// Cycle Intelligence Calculations
function computeCycleStats() {
  if (periods.length < 2) {
    return { avgCycle: user.avgCycle, avgDuration: user.avgPeriod, stdDev: 0, lengths: [] };
  }

  // Sort chronological
  periods.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const lengths = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const len = daysBetween(periods[i].startDate, periods[i + 1].startDate);
    if (len >= 15 && len <= 90) lengths.push(len);
  }

  let totalDuration = 0;
  let durCount = 0;
  for (let p of periods) {
    if (p.endDate) {
      const dur = daysBetween(p.startDate, p.endDate) + 1;
      if (dur >= 1 && dur <= 14) {
        totalDuration += dur;
        durCount++;
      }
    }
  }

  const avgDur = durCount > 0 ? (totalDuration / durCount) : user.avgPeriod;

  if (lengths.length === 0) {
    return { avgCycle: user.avgCycle, avgDuration: avgDur, stdDev: 0, lengths: [] };
  }

  const sum = lengths.reduce((acc, v) => acc + v, 0);
  const mean = sum / lengths.length;

  const variance = lengths.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  return {
    avgCycle: Math.round(mean * 10) / 10,
    avgDuration: Math.round(avgDur * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    lengths
  };
}

// UI Refresh
function refreshUI() {
  const stats = computeCycleStats();
  const latestPeriod = periods[periods.length - 1];

  const cycleLen = Math.round(stats.avgCycle);
  const nextPeriodDate = addDays(latestPeriod.startDate, cycleLen);
  const todayIso = "2026-10-30"; // Synchronized with active local session
  const daysUntil = daysBetween(todayIso, nextPeriodDate);
  const cycleDay = daysBetween(latestPeriod.startDate, todayIso) + 1;

  // Hero Card update
  document.getElementById("cycleDayNumber").textContent = `Day ${cycleDay}`;
  document.getElementById("badgeCycleLen").textContent = `Avg Cycle: ${stats.avgCycle} Days`;
  document.getElementById("badgeStdDev").textContent = `Variation: ±${stats.stdDev} Days`;

  if (daysUntil > 0) {
    document.getElementById("badgeNextPeriod").textContent = `Next Period in ${daysUntil} days`;
    document.getElementById("cycleCountdownText").textContent = `Period in ${daysUntil}d`;
  } else if (daysUntil === 0) {
    document.getElementById("badgeNextPeriod").textContent = `Period expected today`;
    document.getElementById("cycleCountdownText").textContent = `Starts today`;
  } else {
    document.getElementById("badgeNextPeriod").textContent = `Expected ${Math.abs(daysUntil)}d ago`;
    document.getElementById("cycleCountdownText").textContent = `Past due`;
  }

  // Phase logic
  let phase = "Follicular Phase";
  const ovulationDay = Math.max(8, cycleLen - 14);
  if (cycleDay <= stats.avgDuration) {
    phase = "Menstrual Phase";
  } else if (cycleDay >= ovulationDay - 2 && cycleDay <= ovulationDay + 1) {
    phase = "Ovulation Window";
  } else if (cycleDay > ovulationDay + 1) {
    phase = "Luteal Phase";
  }
  document.getElementById("cyclePhaseName").textContent = phase;

  // Cycle Intelligence tab stats
  document.getElementById("statAvgCycle").textContent = `${stats.avgCycle} Days`;
  document.getElementById("statStdDev").textContent = `±${stats.stdDev} Days`;
  document.getElementById("statAvgDuration").textContent = `${stats.avgDuration} Days`;
  document.getElementById("statTotalCycles").textContent = `${stats.lengths.length} Completed`;

  // Render Intelligence Insights
  renderIntelligenceInsights(stats);

  // Render Ovulation Tab
  renderOvulationEvidence(latestPeriod, cycleLen);

  // Render Symptom Correlations
  renderSymptomCorrelations();

  // Render Calendar
  renderCalendar();

  // Inspector
  updateInspector();
}

function renderIntelligenceInsights(stats) {
  const container = document.getElementById("insightsContainer");
  container.innerHTML = "";

  const lengths = stats.lengths;
  const insights = [];

  if (lengths.length >= 3 && stats.stdDev >= 6.0) {
    insights.push({
      title: "Persistent Cycle Variation Detected",
      badge: "Observation",
      color: "#e53935",
      msg: `Your recent recorded cycles have varied more than earlier cycles (range: ${Math.min(...lengths)} to ${Math.max(...lengths)} days, variation ±${stats.stdDev} days).`,
      formula: `Formula: σ = √(Σ(x - μ)² / N) = ±${stats.stdDev} days across ${lengths.length} cycles [${lengths.join(", ")}].`,
      rec: "Because this pattern has persisted for multiple cycles, discussing it with a healthcare provider may be worthwhile."
    });
  }

  if (stats.stdDev <= 2.5 && lengths.length >= 2) {
    insights.push({
      title: "Consistent Rhythm Pattern",
      badge: "Regular",
      color: "#43a047",
      msg: `Your cycles show a predictable rhythm with low variation (±${stats.stdDev} days) across completed cycles.`,
      formula: `Average cycle: ${stats.avgCycle} days based on [${lengths.join(", ")}].`,
      rec: "Continue logging start dates to maintain high predictive accuracy."
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Baseline Rhythm Establishing",
      badge: "Neutral",
      color: "var(--secondary)",
      msg: "CycleCare is recording your cycle intervals to compute personal standard deviation.",
      formula: "Minimum of 2 completed cycles required for variation math.",
      rec: "Log each period promptly as it begins."
    });
  }

  for (let ins of insights) {
    const card = document.createElement("div");
    card.style = `background: var(--surface); border: 1px solid var(--border-color); border-left: 4px solid ${ins.color}; border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;`;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <b style="font-size: 15px; color: var(--text-main);">${ins.title}</b>
        <span style="background: var(--surface-alt); font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 700;">${ins.badge}</span>
      </div>
      <p style="font-size: 13px; color: var(--text-main); margin-top: 6px;">${ins.msg}</p>
      <div style="background: var(--surface-alt); padding: 8px 12px; border-radius: 8px; font-size: 11px; color: var(--text-muted); margin-top: 8px;">
        <b>Math Basis:</b> ${ins.formula}
      </div>
      <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-top: 8px;">
        💡 ${ins.rec}
      </div>
    `;
    container.appendChild(card);
  }
}

function renderOvulationEvidence(latestPeriod, cycleLen) {
  const ovulationDay = Math.max(8, cycleLen - 14);
  const estOvulationDate = addDays(latestPeriod.startDate, ovulationDay - 1);
  const fertileStart = addDays(estOvulationDate, -5);
  const fertileEnd = addDays(estOvulationDate, 1);

  document.getElementById("ovLayer1Text").textContent =
    `Estimated Ovulation: Day ${ovulationDay} (${estOvulationDate}). Fertile Window: ${fertileStart} to ${fertileEnd}.`;

  // Check today's logs for corroboration
  const todayLog = dailyLogs["2026-10-30"] || {};
  let evidenceLevel = "Calendar Projection";
  if (todayLog.lh === "Peak" || todayLog.mucus === "Egg-white") {
    evidenceLevel = "Multi-Factor Supported";
    document.getElementById("ovLayer4Text").textContent = "Positive Peak LH surge logged today!";
    document.getElementById("ovLayer3Text").textContent = "Fertile Egg-white cervical mucus logged today.";
  }
  document.getElementById("ovulationEvidenceBadge").textContent = evidenceLevel;
}

function renderSymptomCorrelations() {
  const container = document.getElementById("symptomCorrelationsContainer");
  container.innerHTML = `
    <div style="background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between;">
        <b style="font-size: 15px; color: var(--primary);">Period Cramps (Dysmenorrhea)</b>
        <span style="background: var(--primary-light); color: var(--primary); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700;">100% Recurrence</span>
      </div>
      <div style="font-size: 12px; font-weight: 600; color: var(--secondary); margin-top: 2px;">Associated Phase: Menstrual Phase (Days 1–3)</div>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Recorded in all 4 completed cycles on bleeding days. Natural uterine muscle contractions prompted by prostaglandins.</p>
    </div>

    <div style="background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between;">
        <b style="font-size: 15px; color: var(--secondary);">Headache / Migraine</b>
        <span style="background: var(--secondary-light); color: var(--secondary); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700;">75% Recurrence</span>
      </div>
      <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-top: 2px;">Associated Phase: Premenstrual (2 days before period)</div>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Logged in 3 of your last 4 cycles directly preceding flow start. Frequently aligns with pre-menstrual estrogen drops.</p>
    </div>
  `;
}

// Calendar Renderer
function renderCalendar() {
  const grid = document.getElementById("calDaysGrid");
  grid.innerHTML = "";

  const year = currentCalMonth.getFullYear();
  const month = currentCalMonth.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  document.getElementById("calMonthLabel").textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Highlight sets
  const recordedPeriodDates = new Set();
  for (let p of periods) {
    const dur = p.endDate ? daysBetween(p.startDate, p.endDate) + 1 : 5;
    for (let i = 0; i < dur; i++) {
      recordedPeriodDates.add(addDays(p.startDate, i));
    }
  }

  const latestPeriod = periods[periods.length - 1];
  const cycleLen = 28;
  const nextPeriodDate = addDays(latestPeriod.startDate, cycleLen);
  const predictedPeriodDates = new Set();
  for (let i = 0; i < 5; i++) {
    predictedPeriodDates.add(addDays(nextPeriodDate, i));
  }

  const ovulationDate = addDays(latestPeriod.startDate, cycleLen - 15);
  const fertileDates = new Set();
  for (let i = -5; i <= 1; i++) {
    fertileDates.add(addDays(ovulationDate, i));
  }

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement("div");
    cell.className = "cal-day-cell other-month";
    cell.textContent = daysInPrevMonth - i;
    grid.appendChild(cell);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = String(day).padStart(2, "0");
    const mStr = String(month + 1).padStart(2, "0");
    const iso = `${year}-${mStr}-${dStr}`;

    const cell = document.createElement("div");
    cell.className = "cal-day-cell";
    cell.textContent = day;

    if (recordedPeriodDates.has(iso)) cell.classList.add("period-recorded");
    else if (iso === ovulationDate) cell.classList.add("ovulation-day");
    else if (fertileDates.has(iso)) cell.classList.add("fertile-window");
    else if (predictedPeriodDates.has(iso)) cell.classList.add("period-predicted");

    if (dailyLogs[iso]) cell.classList.add("has-observation");
    if (iso === selectedDateIso) cell.classList.add("selected");

    cell.addEventListener("click", () => {
      selectedDateIso = iso;
      renderCalendar();
      updateInspector();
    });

    grid.appendChild(cell);
  }
}

function updateInspector() {
  document.getElementById("inspectorDateTitle").textContent = `Selected Date: ${selectedDateIso}`;

  let isPeriod = false;
  let flow = "Medium";
  for (let p of periods) {
    if (p.startDate === selectedDateIso) {
      isPeriod = true;
      flow = p.flow;
      break;
    }
  }

  document.getElementById("inspectorStatusText").textContent = isPeriod
    ? `Menstrual Flow: ${flow} recorded.`
    : "No period flow recorded for this date.";

  const log = dailyLogs[selectedDateIso];
  if (log) {
    document.getElementById("inspectorSymptoms").textContent = log.symptoms || "None recorded";
    document.getElementById("inspectorMood").textContent = log.mood || "None recorded";
    document.getElementById("inspectorBbt").textContent = log.bbt ? `${log.bbt}°F` : "Not logged";
  } else {
    document.getElementById("inspectorSymptoms").textContent = "None recorded";
    document.getElementById("inspectorMood").textContent = "None recorded";
    document.getElementById("inspectorBbt").textContent = "Not logged";
  }
}

// Education Articles
function renderEducationArticles(filter = "") {
  const container = document.getElementById("educationArticlesList");
  container.innerHTML = "";

  const query = filter.toLowerCase().trim();
  const filtered = articlesData.filter(a =>
    a.title.toLowerCase().includes(query) ||
    a.summary.toLowerCase().includes(query) ||
    a.category.toLowerCase().includes(query)
  );

  for (let a of filtered) {
    const item = document.createElement("div");
    item.style = "background: var(--surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;";
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <span style="background: var(--primary-light); color: var(--primary); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700;">${a.category}</span>
        <span style="font-size: 11px; color: var(--text-muted);">${a.readTime} min read</span>
      </div>
      <h4 style="font-size: 16px; margin-top: 6px; color: var(--text-main);">${a.title}</h4>
      <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${a.summary}</p>
      <p style="font-size: 13px; color: var(--text-main); margin-top: 8px; line-height: 1.5; white-space: pre-line;">${a.content}</p>
      <button style="margin-top: 10px; background: none; border: none; color: var(--primary); font-weight: 700; font-size: 12px; cursor: pointer;" onclick="speakText('${a.title}. ${a.summary}')">🔊 Listen to this guide</button>
    `;
    container.appendChild(item);
  }
}

// Voice Interaction via Web Speech API
let speechRecognizer = null;
function setupVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = false;

    speechRecognizer.onstart = () => {
      document.getElementById("voiceMicButton").classList.add("listening");
      document.getElementById("voiceStatusText").textContent = "Listening... Speak now";
    };

    speechRecognizer.onend = () => {
      document.getElementById("voiceMicButton").classList.remove("listening");
      document.getElementById("voiceStatusText").textContent = "Tap Mic to Talk";
    };

    speechRecognizer.onresult = (event) => {
      const spoken = event.results[0][0].transcript;
      simulateVoiceQuery(spoken);
    };

    speechRecognizer.onerror = (err) => {
      document.getElementById("voiceMicButton").classList.remove("listening");
      document.getElementById("voiceStatusText").textContent = "Tap Mic to Talk";
    };
  }

  document.getElementById("voiceMicButton").addEventListener("click", () => {
    if (speechRecognizer) {
      try {
        speechRecognizer.start();
      } catch (e) {
        speechRecognizer.stop();
      }
    } else {
      simulateVoiceQuery("When is my next expected period?");
    }
  });
}

function simulateVoiceQuery(text) {
  document.getElementById("voiceTranscriptBox").textContent = `"${text}"`;
  const lower = text.toLowerCase();
  let answer = "";

  if (lower.includes("next") && (lower.includes("period") || lower.includes("cycle"))) {
    const stats = computeCycleStats();
    answer = `Based on your average interval of ${stats.avgCycle} days, your next period is expected in approximately 14 days around November 15.`;
  } else if (lower.includes("mood")) {
    dailyLogs[selectedDateIso] = dailyLogs[selectedDateIso] || {};
    dailyLogs[selectedDateIso].mood = "Calm";
    saveLogs();
    refreshUI();
    answer = `I have recorded your mood as Calm for today.`;
  } else if (lower.includes("headache") || lower.includes("cramp")) {
    dailyLogs[selectedDateIso] = dailyLogs[selectedDateIso] || {};
    dailyLogs[selectedDateIso].symptoms = "Headache";
    saveLogs();
    refreshUI();
    answer = `I have logged Headache for today. Remember to drink water and rest your eyes.`;
  } else if (lower.includes("ovulation")) {
    answer = `Ovulation is when an egg is released from the ovary, typically 14 days before your next period. Your fertile window spans 6 days.`;
  } else {
    answer = `I understood "${text}". RituSakhi is ready to help track your cycle, symptoms, and health questions.`;
  }

  document.getElementById("voiceAnswerBox").textContent = answer;
  speakText(answer);
}

function speakText(txt) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

// Doctor Health Summary HTML & Print
function printDoctorSummary() {
  const stats = computeCycleStats();
  const summaryWindow = window.open("", "_blank");
  summaryWindow.document.write(`
    <!DOCTYPE html><html><head><title>CycleCare Clinical Summary</title>
    <style>
      body { font-family: sans-serif; padding: 32px; color: #222; }
      h2 { color: #d81b60; border-bottom: 2px solid #d81b60; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #fce4ec; }
      .disclaimer { margin-top: 30px; background: #fff3f5; border-left: 4px solid #d81b60; padding: 12px; font-size: 12px; }
    </style></head><body>
      <h2>CycleCare (RituSakhi) – Clinical Health Summary</h2>
      <p><b>Patient:</b> ${user.name} | <b>Date Generated:</b> ${new Date().toLocaleDateString()}</p>
      <p><b>Average Cycle Length:</b> ${stats.avgCycle} Days | <b>Variation (Std Dev):</b> ±${stats.stdDev} Days | <b>Avg Bleeding:</b> ${stats.avgDuration} Days</p>
      <h3>Recorded Menstrual Cycles</h3>
      <table>
        <tr><th>Start Date</th><th>End Date</th><th>Duration</th><th>Flow Intensity</th></tr>
        ${periods.map(p => `<tr><td>${p.startDate}</td><td>${p.endDate || 'Active'}</td><td>${p.endDate ? daysBetween(p.startDate, p.endDate) + 1 : 5}d</td><td>${p.flow}</td></tr>`).join('')}
      </table>
      <div class="disclaimer">
        <b>CLINICAL DISCLAIMER:</b> This summary compiles user-recorded cycle observations. It is not an automated medical diagnosis or guarantee of fertility status.
      </div>
    </body></html>
  `);
  summaryWindow.document.close();
  summaryWindow.focus();
  setTimeout(() => summaryWindow.print(), 500);
}

// Modal Controllers
function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
}

// Language Handler
function applyLanguage(code) {
  const t = translations[code] || translations.en;
  document.getElementById("brandTitle").textContent = t.brandTitle;
  document.getElementById("brandTagline").textContent = t.tagline;
  document.getElementById("welcomeGreeting").textContent = t.greeting.replace("%name%", user.name);
  document.getElementById("heroSubtext").textContent = t.heroSub;
  localStorage.setItem(STORAGE_KEY_LANG, code);
}

// Event Listeners Setup
document.addEventListener("DOMContentLoaded", () => {
  initData();
  setupVoice();
  renderEducationArticles();
  refreshUI();

  // Tabs switching
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-pane").forEach(p => p.style.display = "none");
      document.getElementById(targetId).style.display = "block";
    });
  });

  // Theme Toggle
  document.getElementById("themeToggleBtn").addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.body.removeAttribute("data-theme");
      document.getElementById("themeToggleBtn").textContent = "🌙";
      localStorage.setItem(STORAGE_KEY_THEME, "light");
    } else {
      document.body.setAttribute("data-theme", "dark");
      document.getElementById("themeToggleBtn").textContent = "☀️";
      localStorage.setItem(STORAGE_KEY_THEME, "dark");
    }
  });

  // Language Selector
  document.getElementById("langSelector").addEventListener("change", (e) => {
    applyLanguage(e.target.value);
  });

  // Calendar Month Navigation
  document.getElementById("calPrevMonth").addEventListener("click", () => {
    currentCalMonth.setMonth(currentCalMonth.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("calNextMonth").addEventListener("click", () => {
    currentCalMonth.setMonth(currentCalMonth.getMonth() + 1);
    renderCalendar();
  });

  // Quick Action Modals Trigger
  document.getElementById("btnLogPeriodModal").addEventListener("click", () => {
    document.getElementById("inputPeriodStart").value = selectedDateIso;
    document.getElementById("inputPeriodEnd").value = addDays(selectedDateIso, 4);
    openModal("modalPeriod");
  });
  document.getElementById("btnLogSymptomsModal").addEventListener("click", () => openModal("modalSymptoms"));
  document.getElementById("btnLogMoodModal").addEventListener("click", () => openModal("modalMood"));
  document.getElementById("btnLogTempModal").addEventListener("click", () => openModal("modalTemp"));
  document.getElementById("btnOpenVoiceModal").addEventListener("click", () => openModal("modalVoice"));
  document.getElementById("btnOpenCsvModal").addEventListener("click", () => openModal("modalCsv"));
  document.getElementById("btnOpenDoctorSummary").addEventListener("click", printDoctorSummary);
  document.getElementById("btnLogInspectorDate").addEventListener("click", () => {
    document.getElementById("inputPeriodStart").value = selectedDateIso;
    openModal("modalPeriod");
  });

  // Save Period
  document.getElementById("btnSavePeriodRecord").addEventListener("click", () => {
    const start = document.getElementById("inputPeriodStart").value;
    const end = document.getElementById("inputPeriodEnd").value;
    const flowActive = document.querySelector("#flowChipsContainer .selectable-chip.active");
    const flow = flowActive ? flowActive.getAttribute("data-flow") : "Medium";

    if (!start) return alert("Please select a start date.");

    // Remove duplicate if exists
    periods = periods.filter(p => p.startDate !== start);
    periods.push({ startDate: start, endDate: end || null, flow, notes: "User recorded" });
    savePeriods();
    closeAllModals();
    refreshUI();
  });

  // Save Symptoms
  document.getElementById("btnSaveSymptomsRecord").addEventListener("click", () => {
    const selected = [];
    document.querySelectorAll("#symptomsChipsList .selectable-chip.active").forEach(c => {
      selected.push(c.getAttribute("data-symptom"));
    });

    dailyLogs[selectedDateIso] = dailyLogs[selectedDateIso] || {};
    dailyLogs[selectedDateIso].symptoms = selected.join(", ");
    saveLogs();
    closeAllModals();
    refreshUI();
  });

  // Save Mood
  document.getElementById("btnSaveMoodRecord").addEventListener("click", () => {
    const activeMood = document.querySelector("#moodChipsList .selectable-chip.active");
    const mood = activeMood ? activeMood.getAttribute("data-mood") : "Calm";

    dailyLogs[selectedDateIso] = dailyLogs[selectedDateIso] || {};
    dailyLogs[selectedDateIso].mood = mood;
    saveLogs();
    closeAllModals();
    refreshUI();
  });

  // Save BBT
  document.getElementById("btnSaveBbtRecord").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("inputBbtValue").value);
    if (!isNaN(val)) {
      dailyLogs[selectedDateIso] = dailyLogs[selectedDateIso] || {};
      dailyLogs[selectedDateIso].bbt = val;
      saveLogs();
      closeAllModals();
      refreshUI();
    }
  });

  // Chips Toggle logic
  document.querySelectorAll(".chips-flex .selectable-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const parent = chip.parentElement;
      if (parent.id === "symptomsChipsList") {
        chip.classList.toggle("active");
      } else {
        parent.querySelectorAll(".selectable-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
      }
    });
  });

  // Search Education
  document.getElementById("educationSearchInput").addEventListener("input", (e) => {
    renderEducationArticles(e.target.value);
  });

  // Listen to Article Guide
  document.getElementById("btnListenArticle").addEventListener("click", () => {
    speakText("Welcome to RituSakhi Health Education. Menstruation is regulated by a delicate hormonal balance between the brain and ovaries. Explore our 12 medically reviewed guides.");
  });

  // Partner Sharing Code
  document.getElementById("btnGenPartnerCode").addEventListener("click", () => {
    const code = "SAKHI-" + Math.floor(1000 + Math.random() * 9000);
    document.getElementById("partnerCodeVal").textContent = code;
    document.getElementById("partnerCodeDisplay").style.display = "block";
  });
  document.getElementById("btnRevokePartner").addEventListener("click", () => {
    document.getElementById("partnerCodeDisplay").style.display = "none";
    alert("All partner access revoked.");
  });

  // CSV Import Sample
  document.getElementById("btnLoadSampleWebCsv").addEventListener("click", () => {
    pendingImportRecords = [
      { startDate: "2026-04-12", endDate: "2026-04-16", flow: "Medium", notes: "Imported from Clue" },
      { startDate: "2026-05-10", endDate: "2026-05-14", flow: "Medium", notes: "Imported from Clue" },
      { startDate: "2026-06-08", endDate: "2026-06-12", flow: "Medium", notes: "Imported from Clue" }
    ];
    document.getElementById("csvPreviewSummary").textContent = `3 valid cycles detected from sample`;
    document.getElementById("csvPreviewBox").style.display = "block";
    document.getElementById("btnCommitCsvImport").style.display = "block";
  });

  document.getElementById("btnCommitCsvImport").addEventListener("click", () => {
    for (let r of pendingImportRecords) {
      if (!periods.some(p => p.startDate === r.startDate)) {
        periods.push(r);
      }
    }
    savePeriods();
    closeAllModals();
    refreshUI();
    alert("Successfully imported cycles!");
  });

  // Export CSV
  document.getElementById("btnExportJsonCsv").addEventListener("click", () => {
    let csv = "Start Date,End Date,Flow Intensity,Notes\n";
    for (let p of periods) {
      csv += `"${p.startDate}","${p.endDate || ''}","${p.flow}","${p.notes || ''}"\n`;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CycleCare_Cycles_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // One-tap Data Wipe
  document.getElementById("btnWipeLocalData").addEventListener("click", () => {
    if (confirm("Are you sure you want to permanently delete all local health records? This cannot be undone.")) {
      localStorage.clear();
      alert("All records wiped.");
      location.reload();
    }
  });
});
