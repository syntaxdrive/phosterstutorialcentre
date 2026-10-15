import "dotenv/config";
import { Bot, InlineKeyboard, InputFile } from "grammy";
import * as XLSX from "xlsx";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import http from "node:http";

const TOKEN = process.env.BOT_TOKEN?.trim();
const ADMIN_IDS = new Set(
  (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);
const DATA_FILE = path.resolve(
  process.env.DATA_FILE || "./data/phosters-data.json"
);

if (!TOKEN || TOKEN === "YOUR_NEW_BOT_TOKEN") {
  console.error("Set your new Telegram bot token in .env.");
  process.exit(1);
}

const bot = new Bot(TOKEN);
let saveQueue = Promise.resolve();

const DEFAULT_SUBJECTS = [
  { id: "english", name: "📖 Use of English", icon: "📖", groupKey: "ENGLISH_URL" },
  { id: "maths", name: "📐 Mathematics", icon: "📐", groupKey: "MATHS_URL" },
  { id: "further_maths", name: "📐 Further Mathematics", icon: "📐", groupKey: "FURTHER_MATHS_URL" },
  { id: "biology", name: "🧬 Biology", icon: "🧬", groupKey: "BIOLOGY_URL" },
  { id: "physics", name: "⚡ Physics", icon: "⚡", groupKey: "PHYSICS_URL" },
  { id: "chemistry", name: "🧪 Chemistry", icon: "🧪", groupKey: "CHEMISTRY_URL" },
  { id: "crs", name: "✝️ Christian Religious Studies", icon: "✝️", groupKey: "CRS_URL" },
  { id: "literature", name: "📚 Literature in English", icon: "📚", groupKey: "LITERATURE_URL" },
  { id: "government", name: "🏛 Government", icon: "🏛", groupKey: "GOVERNMENT_URL" },
  { id: "economics", name: "📊 Economics", icon: "📊", groupKey: "ECONOMICS_URL" }
];

const COURSE_CATALOG = {
  science: {
    name: "Faculty of Science & Health",
    icon: "🔬",
    courses: [
      {
        id: "medicine",
        name: "Medicine & Surgery / Nursing / Pharmacy",
        subjects: ["english", "biology", "chemistry", "physics"],
        description: "Official JAMB requirement for Medical and Allied Health Sciences"
      },
      {
        id: "engineering",
        name: "Engineering (Civil, Mech, Electrical, Comp)",
        subjects: ["english", "maths", "physics", "chemistry"],
        description: "Official JAMB requirement for Engineering faculties"
      },
      {
        id: "comp_sci",
        name: "Computer Science & IT",
        subjects: ["english", "maths", "physics", "chemistry"],
        description: "Standard combination for Computing and Software disciplines"
      },
      {
        id: "agriculture",
        name: "Agricultural Science & Forestry",
        subjects: ["english", "chemistry", "biology", "physics"],
        description: "Standard combination for Agricultural Sciences"
      }
    ]
  },
  arts: {
    name: "Faculty of Arts & Humanities",
    icon: "🎨",
    courses: [
      {
        id: "law",
        name: "Law (Common Law / Civil Law)",
        subjects: ["english", "literature", "government", "economics"],
        description: "Official requirement for Faculty of Law"
      },
      {
        id: "mass_comm",
        name: "Mass Communication & Media",
        subjects: ["english", "literature", "government", "economics"],
        description: "Standard requirement for Media and Communication Studies"
      },
      {
        id: "theatre_arts",
        name: "Theatre Arts & Performing Studies",
        subjects: ["english", "literature", "government", "literature"],
        description: "Requirement for Dramatic & Performing Arts"
      },
      {
        id: "intl_relations",
        name: "International Relations & Diplomacy",
        subjects: ["english", "government", "literature", "economics"],
        description: "Standard requirement for Diplomatic Studies"
      }
    ]
  },
  commercial: {
    name: "Faculty of Commercial & Management",
    icon: "💼",
    courses: [
      {
        id: "accounting",
        name: "Accounting / Banking & Finance",
        subjects: ["english", "maths", "economics", "government"],
        description: "Official JAMB requirement for Financial disciplines"
      },
      {
        id: "business_admin",
        name: "Business Administration & Management",
        subjects: ["english", "maths", "economics", "government"],
        description: "Official requirement for Management Sciences"
      },
      {
        id: "economics_course",
        name: "Economics",
        subjects: ["english", "maths", "economics", "government"],
        description: "Standard requirement for Faculty of Social Sciences"
      }
    ]
  }
};

let database = {
  subjects: DEFAULT_SUBJECTS,
  students: [],
  tutors: [],
  tutorInvites: [],
  groupChatIds: {},
  lessons: [],
  materials: [],
  tests: [],
  results: []
};

const adminFlows = new Map();
const activeSessions = new Map();

const LETTERS = ["A", "B", "C", "D"];

// ---------------- PERMISSION HELPERS ----------------
function isHeadAdmin(ctx) {
  const userId = String(ctx.from?.id ?? "");
  if (ADMIN_IDS.has(userId)) return true;
  const tutor = database.tutors.find((t) => t.userId === userId);
  return tutor?.role === "head_admin";
}

function getTutorRecord(ctx) {
  const userId = String(ctx.from?.id ?? "");
  if (isHeadAdmin(ctx)) {
    return {
      userId,
      name: ctx.from?.first_name || "Head Admin",
      role: "head_admin",
      subjects: ["all"]
    };
  }
  return database.tutors.find((t) => t.userId === userId) || null;
}

function isTutor(ctx) {
  return isHeadAdmin(ctx) || !!getTutorRecord(ctx);
}

function canManageSubject(ctx, subjectId) {
  if (isHeadAdmin(ctx)) return true;
  const tutor = getTutorRecord(ctx);
  if (!tutor) return false;
  return tutor.subjects?.includes("all") || tutor.subjects?.includes(subjectId);
}

function newId(prefix = "") {
  return (prefix ? prefix + "_" : "") + Date.now().toString(36) + randomBytes(3).toString("hex");
}

function sessionKey(userId, testId) {
  return `${userId}:${testId}`;
}

function makeProgressBar(current, total, length = 10) {
  if (total <= 0) return "░".repeat(length);
  const filled = Math.min(length, Math.max(0, Math.round((current / total) * length)));
  return "█".repeat(filled) + "░".repeat(length - filled);
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------- DATABASE PERSISTENCE ----------------
async function saveDatabase() {
  saveQueue = saveQueue.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tempFile = `${DATA_FILE}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(database, null, 2), "utf8");
    await fs.rename(tempFile, DATA_FILE);
  });
  return saveQueue;
}

async function loadDatabase() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    database = {
      subjects: DEFAULT_SUBJECTS,
      students: Array.isArray(data.students) ? data.students : [],
      tutors: Array.isArray(data.tutors) ? data.tutors : [],
      tutorInvites: Array.isArray(data.tutorInvites) ? data.tutorInvites : [],
      groupChatIds: typeof data.groupChatIds === "object" && data.groupChatIds ? data.groupChatIds : {},
      lessons: Array.isArray(data.lessons) ? data.lessons : [],
      materials: Array.isArray(data.materials) ? data.materials : [],
      tests: Array.isArray(data.tests) ? data.tests : [],
      results: Array.isArray(data.results) ? data.results : []
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await saveDatabase();
  }

  for (const adminId of ADMIN_IDS) {
    if (!database.tutors.some((t) => t.userId === adminId)) {
      database.tutors.push({
        userId: adminId,
        name: "Head Administrator",
        role: "head_admin",
        subjects: ["all"]
      });
    }
  }
}

// ---------------- GROUP BROADCAST & NOTIFICATION HELPERS ----------------
let cachedBotUsername = null;
async function getBotUsername() {
  if (!cachedBotUsername) {
    try {
      const me = await bot.api.getMe();
      cachedBotUsername = me.username;
    } catch {
      cachedBotUsername = "Ph0sterbot";
    }
  }
  return cachedBotUsername;
}

async function broadcastToSubjectGroup(subjectId, text, keyboard) {
  const chatId = database.groupChatIds?.[subjectId];
  if (!chatId) return;
  try {
    await bot.api.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error(`Failed to broadcast to subject ${subjectId} group (${chatId}):`, err.message);
  }
}

async function broadcastTestPublished(test) {
  const botUser = await getBotUsername();
  const subj = database.subjects.find((s) => s.id === test.subjectId);
  const text =
    `📢 <b>NEW JAMB PRACTICE TEST IS LIVE!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 <b>Title:</b> ${escapeHtml(test.title)}\n` +
    `⏱ <b>Duration:</b> ${test.durationMinutes} minutes\n` +
    `❓ <b>Questions:</b> ${test.questions.length} questions\n` +
    `🏛 <b>Subject:</b> ${subj?.name || "General"}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Tap the button below to take this mock quietly in your private bot:</i>`;

  const keyboard = new InlineKeyboard().url(
    "📝 Start Test in Private Bot",
    `https://t.me/${botUser}?start=take_${test.id}`
  );

  await broadcastToSubjectGroup(test.subjectId, text, keyboard);
}

async function broadcastVideoPublished(lesson) {
  const botUser = await getBotUsername();
  const subj = database.subjects.find((s) => s.id === lesson.subjectId);
  const text =
    `🎬 <b>NEW VIDEO LESSON UPLOADED!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📖 <b>Title:</b> ${escapeHtml(lesson.title)}\n` +
    `👨‍🏫 <b>Tutor:</b> ${escapeHtml(lesson.tutorName || "Department Tutor")}\n` +
    `🏛 <b>Subject:</b> ${subj?.name || "General"}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Tap below to watch this video lesson in the student classroom:</i>`;

  const keyboard = new InlineKeyboard().url(
    "▶️ Watch in Private Classroom",
    `https://t.me/${botUser}?start=room_${lesson.subjectId}`
  );

  await broadcastToSubjectGroup(lesson.subjectId, text, keyboard);
}

async function broadcastMaterialPublished(material) {
  const botUser = await getBotUsername();
  const subj = database.subjects.find((s) => s.id === material.subjectId);
  const text =
    `📄 <b>NEW STUDY MATERIAL / PDF HANDOUT!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 <b>Title:</b> ${escapeHtml(material.title)}\n` +
    `📎 <b>File:</b> ${escapeHtml(material.fileName)} (${material.fileSize})\n` +
    `👨‍🏫 <b>Tutor:</b> ${escapeHtml(material.tutorName || "Department Tutor")}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Tap below to download this handout directly in your bot:</i>`;

  const keyboard = new InlineKeyboard().url(
    "📥 Download PDF in Private Bot",
    `https://t.me/${botUser}?start=mat_${material.id}`
  );

  await broadcastToSubjectGroup(material.subjectId, text, keyboard);
}

// ---------------- STUDENT PROFILE HELPERS ----------------
function getStudentProfile(userId) {
  let student = database.students.find((s) => s.userId === String(userId));
  if (!student) {
    student = {
      userId: String(userId),
      department: null,
      courseId: null,
      courseName: null,
      registeredSubjects: ["english"]
    };
  }
  return student;
}

function saveStudentProfile(userId, data) {
  const idx = database.students.findIndex((s) => s.userId === String(userId));
  const updated = {
    userId: String(userId),
    ...getStudentProfile(userId),
    ...data,
    updatedAt: new Date().toISOString()
  };
  if (idx >= 0) {
    database.students[idx] = updated;
  } else {
    database.students.push(updated);
  }
  saveDatabase();
  return updated;
}

// ---------------- EXCEL TEMPLATE ----------------
function generateExcelTemplateBuffer() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    {
      question: "Which organelle is known as the powerhouse of the cell?",
      option_a: "Nucleus",
      option_b: "Mitochondria",
      option_c: "Ribosome",
      option_d: "Endoplasmic reticulum",
      correct_answer: "B"
    },
    {
      question: "What is the capital of Nigeria?",
      option_a: "Lagos",
      option_b: "Abuja",
      option_c: "Kano",
      option_d: "Ibadan",
      correct_answer: "B"
    },
    {
      question: "Which gas do green plants absorb during photosynthesis?",
      option_a: "Oxygen",
      option_b: "Nitrogen",
      option_c: "Carbon dioxide",
      option_d: "Hydrogen",
      correct_answer: "C"
    }
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// ---------------- STATS & LEADERBOARD ----------------
function getUserStats(userId) {
  const userResults = database.results.filter((r) => r.userId === String(userId));
  const totalTaken = userResults.length;
  const avgScore = totalTaken
    ? (userResults.reduce((sum, r) => sum + r.percentage, 0) / totalTaken).toFixed(1)
    : "0.0";
  const highestScore = totalTaken
    ? Math.max(...userResults.map((r) => r.percentage)).toFixed(1)
    : "0.0";
  return { totalTaken, avgScore, highestScore, history: userResults.slice(-5).reverse() };
}

function getLeaderboard() {
  const userMap = new Map();
  for (const r of database.results) {
    if (!userMap.has(r.userId)) {
      userMap.set(r.userId, {
        userId: r.userId,
        name: r.firstName || r.username || "Student",
        username: r.username,
        testsCount: 0,
        totalPercentage: 0,
        highestScore: 0
      });
    }
    const entry = userMap.get(r.userId);
    entry.testsCount += 1;
    entry.totalPercentage += r.percentage;
    if (r.percentage > entry.highestScore) {
      entry.highestScore = r.percentage;
    }
  }

  const list = Array.from(userMap.values()).map((entry) => ({
    ...entry,
    average: Number((entry.totalPercentage / entry.testsCount).toFixed(1))
  }));

  list.sort((a, b) => b.average - a.average || b.testsCount - a.testsCount);
  return list;
}

function getUserRank(userId) {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex((item) => item.userId === String(userId));
  return index >= 0 ? index + 1 : null;
}

// ---------------- SMART PARSERS ----------------
function parseSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  if (!workbook.SheetNames.length) {
    throw new Error("The spreadsheet contains no worksheets.");
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length) throw new Error("No question rows found.");
  const questions = rows.map(normalizeQuestionRow);
  const invalid = questions.filter((q) => !q).length;
  if (invalid) {
    throw new Error(`${invalid} row(s) are invalid. Verify four options and correct answers.`);
  }
  return questions;
}

function normalizeHeader(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getColumn(row, aliases) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    const found = entries.find(([name]) => normalizeHeader(name) === key);
    if (found) return String(found[1] ?? "").trim();
  }
  return "";
}

function normalizeAnswer(value, options) {
  const answer = String(value ?? "").trim().toUpperCase();
  if (LETTERS.includes(answer)) return answer;
  if (["1", "2", "3", "4"].includes(answer)) {
    return LETTERS[Number(answer) - 1];
  }
  const index = options.findIndex(
    (option) => option.toLowerCase() === answer.toLowerCase()
  );
  return index < 0 ? null : LETTERS[index];
}

function normalizeQuestionRow(row) {
  const question = getColumn(row, ["question", "question_text", "questiontext", "q"]);
  const options = [
    getColumn(row, ["option_a", "optiona", "choice_a", "a"]),
    getColumn(row, ["option_b", "optionb", "choice_b", "b"]),
    getColumn(row, ["option_c", "optionc", "choice_c", "c"]),
    getColumn(row, ["option_d", "optiond", "choice_d", "d"])
  ];
  const answer = getColumn(row, [
    "correct_answer", "correctanswer", "correct",
    "answer", "answer_key", "key"
  ]);
  const correctAnswer = normalizeAnswer(answer, options);
  if (!question || options.some((item) => !item) || !correctAnswer) {
    return null;
  }
  return { question, options, correctAnswer };
}

function parseSmartTextQuestions(text) {
  if (text.includes("|")) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length !== 6) {
        throw new Error(`Invalid line: "${line}"\nFormat: Question | A | B | C | D | CorrectKey`);
      }
      const q = normalizeQuestionRow({
        question: parts[0],
        option_a: parts[1],
        option_b: parts[2],
        option_c: parts[3],
        option_d: parts[4],
        correct_answer: parts[5]
      });
      if (!q) throw new Error(`Could not parse question: ${line}`);
      return q;
    });
  }

  const rawBlocks = text.split(/(?=(?:^|\n)\s*\d+[\.\)])/).map((b) => b.trim()).filter(Boolean);
  const questions = [];

  for (const block of rawBlocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 5) continue;

    const questionText = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
    const options = [null, null, null, null];
    let correctAnswer = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^([A-Da-d])[\.\)\:\-\]]\s*(.+)$/);
      if (optMatch) {
        const idx = LETTERS.indexOf(optMatch[1].toUpperCase());
        if (idx >= 0) options[idx] = optMatch[2].trim();
        continue;
      }
      const ansMatch = line.match(/(?:Ans|Answer|Key|Correct|Option)[\s\:\-\=]*([A-Da-d])/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase();
      }
    }

    if (questionText && options.every(Boolean) && correctAnswer) {
      questions.push({
        question: questionText,
        options,
        correctAnswer
      });
    }
  }

  if (!questions.length) {
    throw new Error(
      "No valid questions detected.\nEnsure questions are numbered (e.g. 1. Question), followed by options A, B, C, D, and 'Ans: B'."
    );
  }

  return questions;
}

// ---------------- UI HELPERS ----------------
async function safeEditOrReply(ctx, text, replyMarkup) {
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup
      });
      return;
    }
  } catch (err) {
    if (!String(err).includes("message is not modified")) {
      // ignore
    }
  }
  await ctx.reply(text, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup
  });
}

// ---------------- DASHBOARD UI ----------------
function renderStudentDashboard(ctx) {
  const user = ctx.from;
  const name = escapeHtml(user?.first_name || "Student");
  const stats = getUserStats(user?.id);
  const rank = getUserRank(user?.id);
  const rankDisplay = rank ? `#${rank}` : "Unranked";
  const profile = getStudentProfile(user?.id);

  let courseLine = `🎯 <i>Target Course: Not Selected</i>`;
  if (profile.courseName) {
    courseLine = `🎯 <b>Target:</b> <code>${escapeHtml(profile.courseName)}</code>`;
  }

  const text =
    `🎓 <b>PHOSTERS TUTORIAL CENTRE</b>\n` +
    `<i>JAMB &amp; Post-UTME Digital Academy</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👋 <b>Welcome, ${name}!</b>\n` +
    `${courseLine}\n\n` +
    `📊 <b>Mock Tests Taken:</b> <code>${stats.totalTaken}</code>\n` +
    `🎯 <b>Average Score:</b> <code>${stats.avgScore}%</code>\n` +
    `🏅 <b>Centre Rank:</b> <code>${rankDisplay}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Select your learning classroom or activity:</i>`;

  const keyboard = new InlineKeyboard()
    .text("🎯 Choose My 4 JAMB Subjects", "dash:combos")
    .row()
    .text("📚 Subject Classrooms", "dash:classrooms")
    .text("📝 Practice Tests", "dash:tests")
    .row()
    .text("👤 Digital Student ID", "dash:id_card")
    .text("📊 My Performance", "dash:stats")
    .row()
    .text("🏆 Centre Leaderboard", "dash:leaderboard")
    .text("📢 Announcements", "dash:announcements")
    .row()
    .text("💬 Phosters Community", "dash:community")
    .text("ℹ️ Bot Help", "dash:help");

  if (isTutor(ctx)) {
    keyboard.row().text("🧑‍🏫 Tutor Studio", "tutor:studio");
  }
  if (isHeadAdmin(ctx)) {
    keyboard.row().text("👑 Head Admin Cockpit", "admin:dashboard");
  }

  return { text, keyboard };
}

// ---------------- DIGITAL STUDENT ID CARD ----------------
async function showStudentIdCard(ctx) {
  const user = ctx.from;
  const profile = getStudentProfile(user.id);
  const stats = getUserStats(user.id);

  const deptNames = {
    science: "Faculty of Science & Health",
    arts: "Faculty of Arts & Humanities",
    commercial: "Faculty of Commercial & Management"
  };

  const departmentText = deptNames[profile.department] || "General Candidate";
  const courseText = profile.courseName || "General JAMB / Post-UTME Prep";

  const registeredSubjectList = (profile.registeredSubjects || ["english"])
    .map((sid) => {
      const s = database.subjects.find((sub) => sub.id === sid);
      return `• ${s?.name || sid}`;
    })
    .join("\n");

  const text =
    `╔═════════════════════════════════╗\n` +
    `   🎓 <b>PHOSTERS TUTORIAL CENTRE</b>\n` +
    `   <b>OFFICIAL STUDENT IDENTITY CARD</b>\n` +
    `╚═════════════════════════════════╝\n\n` +
    `👤 <b>Candidate Name:</b> ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name || "")}\n` +
    `🆔 <b>Student Roll No:</b> <code>PHO-${user.id}</code>\n` +
    `🏛 <b>Department:</b> <i>${escapeHtml(departmentText)}</i>\n` +
    `🎯 <b>Target Course:</b> <b>${escapeHtml(courseText)}</b>\n\n` +
    `📚 <b>Official 4-Subject Combination:</b>\n` +
    `${registeredSubjectList}\n\n` +
    `📊 <b>Mocks Attempted:</b> <code>${stats.totalTaken}</code> | <b>Avg:</b> <code>${stats.avgScore}%</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `║█║▌║█║▌█║▌█║▌█║▌\n` +
    `<i>Valid for 2026/2027 JAMB &amp; Post-UTME Session</i>`;

  const keyboard = new InlineKeyboard()
    .text("🔄 Change Target Course", "dash:combos")
    .row()
    .text("🏠 Back to Dashboard", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
}

// ---------------- CUSTOM JAMB 4-SUBJECT SELECTOR ----------------
const userSubjectDrafts = new Map();

function getSubjectDraft(userId) {
  if (!userSubjectDrafts.has(userId)) {
    const profile = getStudentProfile(userId);
    const initial = new Set(
      profile.registeredSubjects && profile.registeredSubjects.length
        ? profile.registeredSubjects
        : ["english"]
    );
    initial.add("english"); // English is always compulsory
    userSubjectDrafts.set(userId, initial);
  }
  return userSubjectDrafts.get(userId);
}

async function showCustomSubjectSelector(ctx) {
  const draft = getSubjectDraft(ctx.from.id);
  const count = draft.size;

  let statusMsg = `⏳ <b>${count} of 4 selected</b> (Pick ${4 - count} more subject${4 - count === 1 ? '' : 's'})`;
  if (count === 4) {
    statusMsg = `✅ <b>4 of 4 Selected! Ready to confirm &amp; save.</b>`;
  }

  const text =
    `🎯 <b>CHOOSE YOUR 4 JAMB SUBJECTS</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Use of English is compulsory for all candidates in Nigeria.\n` +
    `Tap the buttons below to select your other 3 subjects:</i>\n\n` +
    `📊 <b>Selection Status:</b> ${statusMsg}`;

  const keyboard = new InlineKeyboard();

  database.subjects.forEach((subj) => {
    if (subj.id === "english") {
      keyboard.text(`🔒 ✅ ${subj.name} (Compulsory)`, `subj_toggle:english`).row();
    } else {
      const isChecked = draft.has(subj.id);
      const icon = isChecked ? "✅" : "⬜";
      keyboard.text(`${icon} ${subj.name}`, `subj_toggle:${subj.id}`).row();
    }
  });

  if (count === 4) {
    keyboard.text("💾 Confirm & Save My 4 Subjects", "subj_save").row();
  } else {
    keyboard.text(`⚠️ Pick Exactly 4 Subjects (${count}/4)`, "subj_incomplete").row();
  }

  keyboard
    .text("💡 Course Recommendations Guide", "dash:course_guide")
    .row()
    .text("🏠 Back to Dashboard", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showDepartmentPicker(ctx) {
  const text =
    `💡 <b>JAMB COURSE COMBINATION GUIDE</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Not sure which 3 subjects to pick with English? Select a faculty below to see official recommendations:`;

  const keyboard = new InlineKeyboard()
    .text("🔬 Science & Health Sciences", "combo_dept:science")
    .row()
    .text("🎨 Arts & Humanities", "combo_dept:arts")
    .row()
    .text("💼 Commercial & Management Sciences", "combo_dept:commercial")
    .row()
    .text("🎯 Back to Subject Selector", "dash:combos");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showDepartmentCourses(ctx, deptKey) {
  const dept = COURSE_CATALOG[deptKey];
  if (!dept) return ctx.reply("Department not found.");

  const text =
    `${dept.icon} <b>${escapeHtml(dept.name.toUpperCase())}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Select any course to view its standard 4-subject requirement:`;

  const keyboard = new InlineKeyboard();
  dept.courses.forEach((c) => {
    keyboard.text(`👉 ${c.name}`, `combo_pick:${deptKey}:${c.id}`).row();
  });
  keyboard.text("🔙 Back to Guidelines", "dash:course_guide");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showCourseCombinationDetail(ctx, deptKey, courseId) {
  const dept = COURSE_CATALOG[deptKey];
  const course = dept?.courses.find((c) => c.id === courseId);
  if (!dept || !course) return ctx.reply("Course combination not found.");

  const subjectRows = course.subjects.map((sid, i) => {
    const s = database.subjects.find((sub) => sub.id === sid);
    return `<b>${i + 1}.</b> ${s?.name || sid}`;
  }).join("\n");

  const text =
    `📚 <b>${escapeHtml(course.name.toUpperCase())}</b>\n` +
    `<i>${dept.icon} ${escapeHtml(dept.name)}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Recommended 4 JAMB Subjects:\n\n` +
    `${subjectRows}\n\n` +
    `ℹ️ <i>${escapeHtml(course.description)}</i>`;

  const keyboard = new InlineKeyboard()
    .text("✅ Apply This 4-Subject Combination", `apply_combo:${deptKey}:${courseId}`)
    .row()
    .text("🔙 Other Courses", `combo_dept:${deptKey}`)
    .row()
    .text("🎯 Custom Subject Selector", "dash:combos");

  await safeEditOrReply(ctx, text, keyboard);
}

// ---------------- SUBJECT CLASSROOMS ----------------
async function showSubjectClassrooms(ctx) {
  const text =
    `🏛 <b>PHOSTERS SUBJECT CLASSROOMS</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Select a subject department to access:\n` +
    `• 🎬 <b>Video Lectures &amp; YouTube</b>\n` +
    `• 📄 <b>PDF Study Notes &amp; Handouts</b>\n` +
    `• 📝 <b>Subject Mock Tests</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Choose a subject to enter:</i>`;

  const keyboard = new InlineKeyboard();
  database.subjects.forEach((subj, i) => {
    keyboard.text(`${subj.icon} ${subj.name}`, `room:${subj.id}`);
    if (i % 2 === 1) keyboard.row();
  });
  if (database.subjects.length % 2 !== 0) keyboard.row();
  keyboard.text("🏠 Back to Dashboard", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showClassroomDetail(ctx, subjectId) {
  const subject = database.subjects.find((s) => s.id === subjectId);
  if (!subject) return ctx.reply("Subject not found.");

  const lessons = database.lessons.filter((l) => l.subjectId === subjectId);
  const materials = database.materials.filter((m) => m.subjectId === subjectId);
  const tests = database.tests.filter((t) => t.subjectId === subjectId || (!t.subjectId && subjectId === "english"));

  const groupUrl = process.env[subject.groupKey];

  const text =
    `🏛 <b>${escapeHtml(subject.name.toUpperCase())} CLASSROOM</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎬 <b>Video Lessons:</b> <code>${lessons.length}</code>\n` +
    `📄 <b>Study Notes &amp; PDFs:</b> <code>${materials.length}</code>\n` +
    `📝 <b>Practice Tests:</b> <code>${tests.length}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Select an area to explore:</i>`;

  const keyboard = new InlineKeyboard()
    .text(`🎬 Video Lessons (${lessons.length})`, `room_les:${subjectId}`)
    .text(`📄 Notes & PDFs (${materials.length})`, `room_mat:${subjectId}`)
    .row()
    .text(`📝 Practice Tests (${tests.length})`, `room_test:${subjectId}`);

  if (groupUrl) {
    keyboard.row().url(`💬 Join ${subject.name} Group`, groupUrl);
  }

  keyboard.row().text("🔙 All Classrooms", "dash:classrooms");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showSubjectLessons(ctx, subjectId) {
  const subject = database.subjects.find((s) => s.id === subjectId);
  const lessons = database.lessons.filter((l) => l.subjectId === subjectId);

  if (!lessons.length) {
    const text =
      `🎬 <b>${escapeHtml(subject?.name || "")} — VIDEO LESSONS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>No video lessons uploaded yet for this subject.</i>\n` +
      `Your tutor will post lectures and YouTube links shortly!`;
    const keyboard = new InlineKeyboard().text("🔙 Back to Classroom", `room:${subjectId}`);
    await safeEditOrReply(ctx, text, keyboard);
    return;
  }

  let text =
    `🎬 <b>${escapeHtml(subject?.name || "")} — VIDEO LECTURES</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const keyboard = new InlineKeyboard();
  lessons.forEach((les, i) => {
    text += `<b>${i + 1}. ${escapeHtml(les.title)}</b>\n`;
    if (les.description) text += `   <i>${escapeHtml(les.description)}</i>\n`;
    text += `   👨‍🏫 <i>Tutor: ${escapeHtml(les.tutorName || "Department Tutor")}</i>\n\n`;

    if (les.url) {
      keyboard.url(`▶️ Watch: ${les.title}`, les.url).row();
    } else if (les.fileId) {
      keyboard.text(`📥 Download Video: ${les.title}`, `send_vid:${les.id}`).row();
    }
  });

  keyboard.text("🔙 Back to Classroom", `room:${subjectId}`);
  await safeEditOrReply(ctx, text.slice(0, 4000), keyboard);
}

async function showSubjectMaterials(ctx, subjectId) {
  const subject = database.subjects.find((s) => s.id === subjectId);
  const materials = database.materials.filter((m) => m.subjectId === subjectId);

  if (!materials.length) {
    const text =
      `📄 <b>${escapeHtml(subject?.name || "")} — STUDY MATERIALS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>No study handouts or PDF notes uploaded yet.</i>\n` +
      `Check back soon or ask your tutor in the subject group!`;
    const keyboard = new InlineKeyboard().text("🔙 Back to Classroom", `room:${subjectId}`);
    await safeEditOrReply(ctx, text, keyboard);
    return;
  }

  let text =
    `📄 <b>${escapeHtml(subject?.name || "")} — STUDY HANDOUTS &amp; NOTES</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Tap any material to receive the document directly in Telegram:</i>\n\n`;

  const keyboard = new InlineKeyboard();
  materials.forEach((mat) => {
    text += `<b>• 📄 ${escapeHtml(mat.title)}</b> (${mat.fileSize || "PDF"})\n`;
    if (mat.description) text += `   <i>${escapeHtml(mat.description)}</i>\n`;
    keyboard.text(`📥 Download: ${mat.title}`, `send_doc:${mat.id}`).row();
  });

  keyboard.text("🔙 Back to Classroom", `room:${subjectId}`);
  await safeEditOrReply(ctx, text.slice(0, 4000), keyboard);
}

async function showSubjectTests(ctx, subjectId) {
  const subject = database.subjects.find((s) => s.id === subjectId);
  const tests = database.tests.filter((t) => t.subjectId === subjectId || (!t.subjectId && subjectId === "english"));

  if (!tests.length) {
    const text =
      `📝 <b>${escapeHtml(subject?.name || "")} — PRACTICE TESTS</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>No practice tests published yet for this subject.</i>`;
    const keyboard = new InlineKeyboard().text("🔙 Back to Classroom", `room:${subjectId}`);
    await safeEditOrReply(ctx, text, keyboard);
    return;
  }

  const text =
    `📝 <b>${escapeHtml(subject?.name || "")} — PRACTICE TESTS</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Select a mock test to begin. Tests are timed with instant marking:`;

  const keyboard = new InlineKeyboard();
  tests.forEach((t) => {
    keyboard.text(`📝 ${t.title} (${t.questions.length} Qs, ${t.durationMinutes}m)`, `take:${t.id}`).row();
  });
  keyboard.text("🔙 Back to Classroom", `room:${subjectId}`);

  await safeEditOrReply(ctx, text, keyboard);
}

// ---------------- TUTOR STUDIO ----------------
async function showTutorStudio(ctx) {
  if (!isTutor(ctx)) return ctx.reply("⛔ Tutor access required.");
  const tutor = getTutorRecord(ctx);
  const allowedSubjects = tutor?.subjects?.includes("all")
    ? database.subjects
    : database.subjects.filter((s) => tutor?.subjects?.includes(s.id));

  const text =
    `🧑‍🏫 <b>PHOSTERS TUTOR STUDIO</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Welcome, <b>${escapeHtml(tutor?.name || ctx.from.first_name)}</b>!\n` +
    `<b>Role:</b> ${isHeadAdmin(ctx) ? "👑 Head Administrator" : "🧑‍🏫 Subject Tutor"}\n\n` +
    `<i>Select an assigned subject to manage lessons, notes, and tests:</i>`;

  const keyboard = new InlineKeyboard();
  allowedSubjects.forEach((subj, i) => {
    keyboard.text(`${subj.icon} Manage ${subj.name}`, `tut_subj:${subj.id}`);
    if (i % 2 === 1) keyboard.row();
  });
  if (allowedSubjects.length % 2 !== 0) keyboard.row();
  keyboard.text("🏠 Return to Student Portal", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showTutorSubjectCockpit(ctx, subjectId) {
  if (!canManageSubject(ctx, subjectId)) {
    return ctx.reply("⛔ You are not authorized to manage this subject.");
  }
  const subject = database.subjects.find((s) => s.id === subjectId);
  const lessonsCount = database.lessons.filter((l) => l.subjectId === subjectId).length;
  const materialsCount = database.materials.filter((m) => m.subjectId === subjectId).length;
  const testsCount = database.tests.filter((t) => t.subjectId === subjectId).length;

  const text =
    `🧑‍🏫 <b>TUTOR COCKPIT: ${escapeHtml(subject.name.toUpperCase())}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 <b>Subject Inventory:</b>\n` +
    `• Videos: <code>${lessonsCount}</code> | Notes: <code>${materialsCount}</code> | Tests: <code>${testsCount}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Choose an action to manage ${subject.name}:</i>`;

  const keyboard = new InlineKeyboard()
    .text("🎬 Add Video / YouTube", `tut_add_vid:${subjectId}`)
    .text("📄 Upload PDF Notes", `tut_add_mat:${subjectId}`)
    .row()
    .text("📝 Smart Create Test", `tut_add_test:${subjectId}`)
    .text("📥 Download Excel Template", `tut_dl_tpl`)
    .row()
    .text("⚡ Load JAMB Starter Mock", `tut_load_demo:${subjectId}`)
    .row()
    .text("📋 View Subject Submissions", `tut_scores:${subjectId}`)
    .row()
    .text("🔙 Tutor Studio", "tutor:studio");

  await safeEditOrReply(ctx, text, keyboard);
}

// ---------------- HEAD ADMIN COCKPIT ----------------
function renderAdminDashboard() {
  const totalTests = database.tests.length;
  const totalResults = database.results.length;
  const uniqueStudents = new Set(database.results.map((r) => r.userId)).size;
  const totalTutors = database.tutors.length;

  const text =
    `👑 <b>HEAD ADMINISTRATOR COCKPIT</b>\n` +
    `<i>Phosters Centre-Wide Governance &amp; Controls</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 <b>Platform Metrics:</b>\n` +
    `• <b>Staff &amp; Tutors:</b> <code>${totalTutors}</code>\n` +
    `• <b>Total Tests:</b> <code>${totalTests}</code>\n` +
    `• <b>Student Submissions:</b> <code>${totalResults}</code>\n` +
    `• <b>Registered Candidates:</b> <code>${uniqueStudents}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Administrative Controls:</i>`;

  const keyboard = new InlineKeyboard()
    .text("👥 Manage Tutors & Invites", "admin:tutors")
    .row()
    .text("📋 Manage Tests (All)", "admin:tests")
    .text("🗑 Delete Tests", "admin:delete_menu")
    .row()
    .text("📈 All Student Submissions", "admin:results")
    .row()
    .text("🧑‍🏫 Open Tutor Studio", "tutor:studio")
    .text("🏠 Student Portal", "dash:home");

  return { text, keyboard };
}

async function showTutorsList(ctx) {
  if (!isHeadAdmin(ctx)) return ctx.reply("⛔ Head Admin only.");

  let text =
    `👥 <b>PHOSTERS TUTORS &amp; ACADEMIC STAFF</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (!database.tutors.length) {
    text += `<i>No additional tutors registered yet.</i>\n\n`;
  } else {
    database.tutors.forEach((t, i) => {
      const subjectNames = t.subjects?.includes("all")
        ? "🌟 All Subjects (Head Admin)"
        : t.subjects?.map((sid) => database.subjects.find((s) => s.id === sid)?.name || sid).join(", ");

      text += `<b>${i + 1}. ${escapeHtml(t.name)}</b> (ID: <code>${t.userId}</code>)\n`;
      text += `   Role: <code>${t.role}</code>\n`;
      text += `   Subjects: <i>${subjectNames}</i>\n\n`;
    });
  }

  const keyboard = new InlineKeyboard()
    .text("🔗 1-Click Invite Link", "admin:new_invite")
    .text("➕ Add Tutor by ID", "admin:add_tutor_id")
    .row()
    .text("🗑 Remove a Tutor", "admin:remove_tutor_menu")
    .row()
    .text("🔙 Admin Cockpit", "admin:dashboard");

  await safeEditOrReply(ctx, text.slice(0, 4000), keyboard);
}

async function showInviteSubjectPicker(ctx) {
  if (!isHeadAdmin(ctx)) return ctx.reply("⛔ Head Admin only.");

  const text =
    `🔗 <b>CREATE TUTOR INVITE LINK</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Choose which subject the invited tutor will manage:\n` +
    `<i>When the tutor taps the generated link in Telegram, they will automatically be assigned as that subject's tutor!</i>`;

  const keyboard = new InlineKeyboard();
  database.subjects.forEach((subj, i) => {
    keyboard.text(`${subj.icon} ${subj.name}`, `gen_inv:${subj.id}`);
    if (i % 2 === 1) keyboard.row();
  });
  if (database.subjects.length % 2 !== 0) keyboard.row();
  keyboard.text("🌟 All Subjects (General Tutor)", `gen_inv:all`).row();
  keyboard.text("🔙 Cancel", "admin:tutors");

  await safeEditOrReply(ctx, text, keyboard);
}

// ---------------- TEST RUNTIME ----------------
function renderQuestionScreen(test, index) {
  const question = test.questions[index];
  const total = test.questions.length;
  const current = index + 1;
  const progressBar = makeProgressBar(current, total, 10);

  const formattedOptions = question.options
    .map((opt, i) => `<b>${LETTERS[i]}.</b> ${escapeHtml(opt)}`)
    .join("\n");

  const text =
    `📝 <b>${escapeHtml(test.title)}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Progress:</b> [<code>${progressBar}</code>] <b>${current}/${total}</b>\n` +
    `⏱ <b>Duration:</b> ${test.durationMinutes} minutes\n\n` +
    `<b>Question ${current}:</b>\n` +
    `${escapeHtml(question.question)}\n\n` +
    `${formattedOptions}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Tap an option below:</i>`;

  const keyboard = new InlineKeyboard();
  question.options.forEach((opt, i) => {
    const label = `${LETTERS[i]}. ${opt.length > 28 ? opt.substring(0, 25) + '...' : opt}`;
    keyboard.text(label, `ans:${test.id}:${index}:${LETTERS[i]}`).row();
  });
  keyboard.text("❌ Cancel Test", `dash:tests`);

  return { text, keyboard };
}

async function startTest(ctx, test) {
  if (!test?.questions?.length) {
    await ctx.reply("⚠️ This test currently has no questions.");
    return;
  }
  const key = sessionKey(ctx.from.id, test.id);
  const prevSession = activeSessions.get(key);
  if (prevSession?.timer) clearTimeout(prevSession.timer);

  const session = {
    testId: test.id,
    currentQuestion: 0,
    answers: {},
    startedAt: Date.now(),
    finished: false,
    timer: null
  };

  if (test.durationMinutes > 0) {
    session.timer = setTimeout(async () => {
      if (!session.finished) {
        await finishTest(ctx, test, session, true);
      }
    }, test.durationMinutes * 60 * 1000);
  }

  activeSessions.set(key, session);
  const { text, keyboard } = renderQuestionScreen(test, 0);
  await safeEditOrReply(ctx, text, keyboard);
}

async function finishTest(ctx, test, session, timedOut = false) {
  if (session.finished) return;
  session.finished = true;
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }
  activeSessions.delete(sessionKey(ctx.from.id, test.id));

  const total = test.questions.length;
  let score = 0;
  for (let i = 0; i < total; i++) {
    if (session.answers[i] === test.questions[i].correctAnswer) {
      score++;
    }
  }

  const percentage = total ? Number(((score / total) * 100).toFixed(1)) : 0;
  let badge = "📖 Needs Review";
  if (percentage >= 80) badge = "🌟 Outstanding / Distinction";
  else if (percentage >= 60) badge = "🎯 Good Pass / Credit";
  else if (percentage >= 50) badge = "👍 Fair Pass";

  const resultRecord = {
    id: newId("res"),
    testId: test.id,
    testTitle: test.title,
    subjectId: test.subjectId || "general",
    userId: String(ctx.from.id),
    username: ctx.from.username || "",
    firstName: ctx.from.first_name || "",
    score,
    total,
    percentage,
    answers: { ...session.answers },
    timedOut,
    completedAt: new Date().toISOString()
  };

  database.results.push(resultRecord);
  await saveDatabase();

  const progressBar = makeProgressBar(score, total, 10);
  const text =
    `🎓 <b>EXAMINATION RESULT CARD</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 <b>Test:</b> ${escapeHtml(test.title)}\n` +
    `👤 <b>Student:</b> ${escapeHtml(ctx.from.first_name || "Student")}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎯 <b>Final Score:</b> <b>${score} / ${total}</b>\n` +
    `📊 <b>Percentage:</b> <code>[${progressBar}] ${percentage}%</code>\n` +
    `🏅 <b>Assessment:</b> ${badge}\n` +
    (timedOut ? `⚠️ <i>Ended due to time limit.</i>\n` : `⏱ <i>Submitted within time limit.</i>\n`) +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Tap below to review corrections or return home:</i>`;

  const keyboard = new InlineKeyboard()
    .text("📋 Review Corrections", `rev:${resultRecord.id}`)
    .row()
    .text("🔄 Retake Test", `take:${test.id}`)
    .text("🏠 Main Dashboard", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
}

async function showCorrections(ctx, resultId) {
  const result = database.results.find((r) => r.id === resultId);
  if (!result) return ctx.reply("Result record not found.");
  const test = database.tests.find((t) => t.id === result.testId);
  if (!test) return ctx.reply("Test questions are no longer available.");

  let text =
    `🔍 <b>DETAILED CORRECTIONS REVIEW</b>\n` +
    `📝 <b>Test:</b> ${escapeHtml(test.title)}\n` +
    `🎯 <b>Your Score:</b> ${result.score}/${result.total} (${result.percentage}%)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  test.questions.forEach((q, i) => {
    const studentAns = result.answers?.[i] || "None";
    const isCorrect = studentAns === q.correctAnswer;
    const mark = isCorrect ? "✅ Correct" : "❌ Incorrect";

    text += `<b>Q${i + 1}: ${escapeHtml(q.question)}</b>\n`;
    text += `• Your Answer: <b>${studentAns}</b> (${mark})\n`;
    if (!isCorrect) {
      text += `• Correct Answer: <b>${q.correctAnswer}</b>\n`;
    }
    text += `\n`;
  });

  const keyboard = new InlineKeyboard()
    .text("🔄 Retake Test", `take:${test.id}`)
    .text("🏠 Dashboard", "dash:home");

  await safeEditOrReply(ctx, text.slice(0, 4000), keyboard);
}

// ---------------- COMMAND DISPATCHERS ----------------
bot.command(["start", "dashboard", "menu"], async (ctx) => {
  const payload = ctx.match?.trim();

  // 1. Deep link: Take Test in private
  if (payload && payload.startsWith("take_")) {
    const testId = payload.replace("take_", "");
    const test = database.tests.find((t) => t.id === testId);
    if (test) {
      await startTest(ctx, test);
      return;
    }
  }

  // 2. Deep link: Download Material in private
  if (payload && payload.startsWith("mat_")) {
    const matId = payload.replace("mat_", "");
    const mat = database.materials.find((m) => m.id === matId);
    if (mat) {
      await ctx.replyWithDocument(mat.fileId, {
        caption: `📄 <b>${escapeHtml(mat.title)}</b>\n${escapeHtml(mat.description || "")}`,
        parse_mode: "HTML"
      });
      return;
    }
  }

  // 3. Deep link: Open Classroom
  if (payload && payload.startsWith("room_")) {
    const subjId = payload.replace("room_", "");
    const subj = database.subjects.find((s) => s.id === subjId);
    if (subj) {
      await showClassroomDetail(ctx, subjId);
      return;
    }
  }

  // 4. Tutor invite link
  if (payload && payload.startsWith("inv_")) {
    const invite = database.tutorInvites.find((inv) => inv.code === payload && !inv.redeemed);
    if (invite) {
      invite.redeemed = true;
      invite.redeemedBy = String(ctx.from.id);
      invite.redeemedAt = new Date().toISOString();

      let tutorRecord = database.tutors.find((t) => t.userId === String(ctx.from.id));
      if (!tutorRecord) {
        tutorRecord = {
          userId: String(ctx.from.id),
          name: ctx.from.first_name || "Tutor",
          username: ctx.from.username || "",
          role: "tutor",
          subjects: invite.subjectIds
        };
        database.tutors.push(tutorRecord);
      } else {
        const merged = new Set([...(tutorRecord.subjects || []), ...invite.subjectIds]);
        tutorRecord.subjects = Array.from(merged);
      }
      await saveDatabase();

      const subjectNames = invite.subjectIds.includes("all")
        ? "All Subjects"
        : invite.subjectIds.map((id) => database.subjects.find((s) => s.id === id)?.name || id).join(", ");

      await ctx.reply(
        `🎉 <b>WELCOME TO PHOSTERS ACADEMIC FACULTY!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `You have been appointed as Tutor for:\n` +
        `👉 <b>${escapeHtml(subjectNames)}</b>\n\n` +
        `Your <b>Tutor Studio</b> is now unlocked!`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text("🧑‍🏫 Open Tutor Studio", "tutor:studio")
        }
      );
      return;
    }
  }

  const { text, keyboard } = renderStudentDashboard(ctx);
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});

bot.command(["setsubject", "bindgroup", "linkgroup"], async (ctx) => {
  if (ctx.chat.type === "private") {
    return ctx.reply("ℹ️ Please run this command inside your Telegram subject group to link it to a subject.");
  }
  if (!isHeadAdmin(ctx) && !isAdmin(ctx)) {
    return ctx.reply("⛔ Administrator access required to link this group.");
  }

  const subjectArg = ctx.match?.trim().toLowerCase();
  if (subjectArg) {
    const found = database.subjects.find((s) => s.id === subjectArg || s.name.toLowerCase().includes(subjectArg));
    if (found) {
      database.groupChatIds[found.id] = ctx.chat.id;
      await saveDatabase();
      return ctx.reply(`✅ <b>This group is now officially linked to ${found.name}!</b>\nAll tests, video lectures, and PDF study notes for ${found.name} will be automatically broadcast here.`, { parse_mode: "HTML" });
    }
  }

  const text =
    `🏛 <b>LINK THIS GROUP TO A SUBJECT</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Choose which subject classroom this Telegram group represents:\n` +
    `<i>Once linked, new practice tests, videos, and study handouts will automatically be posted here!</i>`;

  const keyboard = new InlineKeyboard();
  database.subjects.forEach((subj, i) => {
    keyboard.text(`${subj.icon} ${subj.name}`, `bind_grp:${subj.id}:${ctx.chat.id}`);
    if (i % 2 === 1) keyboard.row();
  });
  if (database.subjects.length % 2 !== 0) keyboard.row();

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});

bot.callbackQuery(/^bind_grp:(.+):(.+)$/, async (ctx) => {
  if (!isHeadAdmin(ctx) && !isAdmin(ctx)) {
    return ctx.answerCallbackQuery({ text: "Administrator access required.", show_alert: true });
  }
  const [, subjectId, chatIdStr] = ctx.match;
  const chatId = parseInt(chatIdStr, 10);
  const subj = database.subjects.find((s) => s.id === subjectId);
  if (!subj) return ctx.answerCallbackQuery();

  database.groupChatIds[subjectId] = chatId;
  await saveDatabase();

  await ctx.answerCallbackQuery({ text: `Linked to ${subj.name}!`, show_alert: false });
  await safeEditOrReply(
    ctx,
    `✅ <b>GROUP SUCCESSFULLY LINKED!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• <b>Subject:</b> ${subj.name}\n` +
    `• <b>Group ID:</b> <code>${chatId}</code>\n\n` +
    `All tests, video lessons, and PDF handouts published for ${subj.name} will now automatically appear here!`,
    new InlineKeyboard()
  );
});

bot.command(["groupleaderboard", "topstudents"], async (ctx) => {
  let targetSubjectId = null;
  if (ctx.chat.type !== "private") {
    for (const [sid, cid] of Object.entries(database.groupChatIds || {})) {
      if (String(cid) === String(ctx.chat.id)) {
        targetSubjectId = sid;
        break;
      }
    }
  }

  let relevantResults = database.results;
  let title = "PHOSTERS ACADEMY TOP SCORERS";
  if (targetSubjectId) {
    relevantResults = database.results.filter((r) => r.subjectId === targetSubjectId);
    const s = database.subjects.find((sub) => sub.id === targetSubjectId);
    title = `TOP SCORERS: ${s?.name?.toUpperCase() || ""}`;
  }

  if (!relevantResults.length) {
    return ctx.reply(`📊 <b>${title}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n<i>No test scores recorded yet!</i>`, { parse_mode: "HTML" });
  }

  const lines = relevantResults.slice(-5).reverse().map((r, i) => {
    let medal = `<b>#${i + 1}</b>`;
    if (i === 0) medal = "🥇";
    else if (i === 1) medal = "🥈";
    else if (i === 2) medal = "🥉";
    const student = r.username ? `@${escapeHtml(r.username)}` : escapeHtml(r.firstName || "Student");
    return `${medal} ${student} — <b>${r.score}/${r.total}</b> (<code>${r.percentage}%</code>) on <i>${escapeHtml(r.testTitle)}</i>`;
  });

  const botUser = await getBotUsername();
  const text =
    `🏆 <b>${title}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    lines.join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Practice daily in the bot to get your name on the board!</i>`;

  const keyboard = new InlineKeyboard().url(
    "📝 Take Practice Test",
    targetSubjectId
      ? `https://t.me/${botUser}?start=room_${targetSubjectId}`
      : `https://t.me/${botUser}?start=tests`
  );

  await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});

bot.command("id", showStudentIdCard);
bot.command("tutor", showTutorStudio);
bot.command("admin", async (ctx) => {
  if (!isHeadAdmin(ctx)) return ctx.reply("⛔ Head Admin only.");
  const { text, keyboard } = renderAdminDashboard();
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});

bot.command("myid", async (ctx) => {
  const user = ctx.from;
  let status = "🎓 Standard Student Access";
  if (isHeadAdmin(ctx)) status = "👑 Head Administrator";
  else if (isTutor(ctx)) status = "🧑‍🏫 Subject Tutor";

  await ctx.reply(
    `👤 <b>YOUR TELEGRAM IDENTITY</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• Name: <b>${escapeHtml(user.first_name)}</b>\n` +
    `• Telegram ID: <code>${user.id}</code>\n` +
    `• Authorization: <b>${status}</b>`,
    { parse_mode: "HTML" }
  );
});

bot.command(["subjects", "combos"], showCustomSubjectSelector);
bot.command("classrooms", showSubjectClassrooms);

bot.command(["help", "commands", "codes"], async (ctx) => {
  const userIsAdmin = isHeadAdmin(ctx);
  const userIsTutor = isTutor(ctx);

  let text =
    `📖 <b>PHOSTERS DIGITAL ACADEMY — COMMAND DIRECTORY</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎓 <b>STUDENT COMMANDS:</b>\n` +
    `• /start or /menu — Open your interactive Student Dashboard\n` +
    `• /subjects — Select your 4 JAMB subject combination\n` +
    `• /classrooms — Access subject video lectures &amp; PDF notes\n` +
    `• /tests — Browse all available timed practice mock tests\n` +
    `• /id — View your official Digital Student ID Card\n` +
    `• /stats — Check your personal score history &amp; percentage\n` +
    `• /leaderboard — View top candidate rankings in the centre\n` +
    `• /myid — View your Telegram ID &amp; authorization status\n` +
    `• /help or /commands — Display this available commands directory\n\n`;

  if (userIsTutor || userIsAdmin) {
    text +=
      `🧑‍🏫 <b>TUTOR COMMANDS:</b>\n` +
      `• /tutor — Open Tutor Studio (publish videos, PDF notes &amp; tests)\n\n`;
  }

  if (userIsAdmin) {
    text +=
      `👑 <b>HEAD ADMINISTRATOR COMMANDS:</b>\n` +
      `• /admin — Open Head Administrator Governance Cockpit\n` +
      `• /addtutor — Appoint a tutor by Telegram ID (/addtutor <ID> <subject>)\n` +
      `• /setsubject — Link a Telegram group to a subject classroom\n` +
      `• /groupleaderboard — Broadcast subject top scorers in a group\n\n`;
  }

  text +=
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 <i>Tip: You can also tap the <b>[/]</b> menu button beside your chat input bar to trigger any command with 1 tap!</i>`;

  const keyboard = new InlineKeyboard().text("🏠 Back to Dashboard", "dash:home");
  await ctx.reply(text, { parse_mode: "HTML", reply_markup: keyboard });
});

bot.command("addtutor", async (ctx) => {
  if (!isHeadAdmin(ctx)) return ctx.reply("⛔ Head Admin only.");
  const parts = ctx.match?.trim().split(/\s+/);
  if (!parts || parts.length < 2) {
    return ctx.reply(
      `ℹ️ <b>Usage:</b> <code>/addtutor &lt;TelegramID&gt; &lt;subject&gt;</code>\n\n` +
      `<b>Examples:</b>\n` +
      `<code>/addtutor 123456789 biology</code>\n` +
      `<code>/addtutor 987654321 maths</code>\n` +
      `<code>/addtutor 555666777 all</code>`,
      { parse_mode: "HTML" }
    );
  }

  const targetUserId = parts[0].replace(/[^0-9]/g, "");
  const subjInput = parts[1].toLowerCase();
  const subj = database.subjects.find((s) => s.id === subjInput || s.name.toLowerCase().includes(subjInput));

  if (!subj && subjInput !== "all") {
    return ctx.reply(`❌ Subject "${parts[1]}" not recognized. Available subjects: biology, chemistry, physics, maths, english, economics, government, literature, crs, further_maths, all.`);
  }

  const subjIds = subjInput === "all" ? ["all"] : [subj.id];
  let tutor = database.tutors.find((t) => t.userId === targetUserId);
  if (!tutor) {
    tutor = {
      userId: targetUserId,
      name: "Tutor",
      role: "tutor",
      subjects: subjIds
    };
    database.tutors.push(tutor);
  } else {
    tutor.subjects = subjIds;
  }
  await saveDatabase();

  const subjName = subjInput === "all" ? "All Subjects" : subj.name;
  await ctx.reply(
    `✅ <b>TUTOR APPOINTED!</b>\n` +
    `• <b>Telegram ID:</b> <code>${targetUserId}</code>\n` +
    `• <b>Subject:</b> ${subjName}\n\n` +
    `This tutor can now access their management studio using <b>/tutor</b>.`,
    { parse_mode: "HTML" }
  );
});

// ---------------- CALLBACK ROUTING ----------------
bot.callbackQuery("dash:home", async (ctx) => {
  await ctx.answerCallbackQuery();
  const { text, keyboard } = renderStudentDashboard(ctx);
  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery("dash:id_card", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showStudentIdCard(ctx);
});

bot.callbackQuery("dash:combos", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showCustomSubjectSelector(ctx);
});

bot.callbackQuery("dash:course_guide", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showDepartmentPicker(ctx);
});

bot.callbackQuery(/^combo_dept:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showDepartmentCourses(ctx, ctx.match[1]);
});

bot.callbackQuery(/^combo_pick:(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const [, deptKey, courseId] = ctx.match;
  await showCourseCombinationDetail(ctx, deptKey, courseId);
});

bot.callbackQuery(/^apply_combo:(.+):(.+)$/, async (ctx) => {
  const [, deptKey, courseId] = ctx.match;
  const dept = COURSE_CATALOG[deptKey];
  const course = dept?.courses.find((c) => c.id === courseId);
  if (!dept || !course) return ctx.answerCallbackQuery();

  const draft = getSubjectDraft(ctx.from.id);
  draft.clear();
  course.subjects.forEach((s) => draft.add(s));
  draft.add("english");

  await ctx.answerCallbackQuery({ text: `Applied ${course.name} combination!`, show_alert: false });
  await showCustomSubjectSelector(ctx);
});

bot.callbackQuery(/^subj_toggle:(.+)$/, async (ctx) => {
  const subjId = ctx.match[1];
  if (subjId === "english") {
    await ctx.answerCallbackQuery({
      text: "Use of English is compulsory for every JAMB candidate and cannot be unselected!",
      show_alert: true
    });
    return;
  }

  const draft = getSubjectDraft(ctx.from.id);
  if (draft.has(subjId)) {
    draft.delete(subjId);
    await ctx.answerCallbackQuery();
  } else {
    if (draft.size >= 4) {
      await ctx.answerCallbackQuery({
        text: "You can only select 4 subjects for JAMB! Tap a checked subject to uncheck it first.",
        show_alert: true
      });
      return;
    }
    draft.add(subjId);
    await ctx.answerCallbackQuery();
  }

  await showCustomSubjectSelector(ctx);
});

bot.callbackQuery("subj_incomplete", async (ctx) => {
  const draft = getSubjectDraft(ctx.from.id);
  const remaining = 4 - draft.size;
  await ctx.answerCallbackQuery({
    text: `You have selected ${draft.size} of 4 subjects. Please choose ${remaining} more subject${remaining === 1 ? '' : 's'} before confirming!`,
    show_alert: true
  });
});

bot.callbackQuery("subj_save", async (ctx) => {
  const draft = getSubjectDraft(ctx.from.id);
  if (draft.size !== 4) {
    await ctx.answerCallbackQuery({
      text: "Please select exactly 4 subjects before saving!",
      show_alert: true
    });
    return;
  }
  await ctx.answerCallbackQuery();

  const subjectList = Array.from(draft);

  let detectedDept = "science";
  let deptName = "Faculty of Science & Health";
  if (subjectList.some((s) => ["biology", "chemistry", "physics"].includes(s))) {
    detectedDept = "science";
    deptName = "Faculty of Science & Health";
  } else if (subjectList.some((s) => ["literature", "crs"].includes(s))) {
    detectedDept = "arts";
    deptName = "Faculty of Arts & Humanities";
  } else if (subjectList.some((s) => ["economics", "government"].includes(s))) {
    detectedDept = "commercial";
    deptName = "Faculty of Commercial & Management";
  }

  saveStudentProfile(ctx.from.id, {
    department: detectedDept,
    courseName: "Custom Registered Combination",
    registeredSubjects: subjectList
  });

  const subjectRows = subjectList.map((sid, i) => {
    const s = database.subjects.find((sub) => sub.id === sid);
    return `<b>${i + 1}.</b> ${s?.name || sid}`;
  }).join("\n");

  const text =
    `🎉 <b>YOUR 4 JAMB SUBJECTS ARE CONFIRMED!</b>\n` +
    `<i>${deptName}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 <b>Your Registered Combination:</b>\n\n` +
    `${subjectRows}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 <i>Tap any subject below to enter the classroom and join its group:</i>`;

  const keyboard = new InlineKeyboard();
  subjectList.forEach((sid) => {
    const s = database.subjects.find((sub) => sub.id === sid);
    keyboard.text(`${s?.icon || '📚'} Enter ${s?.name || sid}`, `room:${sid}`).row();
  });

  keyboard
    .text("👤 View My Student ID", "dash:id_card")
    .text("🏠 Dashboard", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery("dash:classrooms", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSubjectClassrooms(ctx);
});

bot.callbackQuery(/^room:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showClassroomDetail(ctx, ctx.match[1]);
});

bot.callbackQuery(/^room_les:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSubjectLessons(ctx, ctx.match[1]);
});

bot.callbackQuery(/^room_mat:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSubjectMaterials(ctx, ctx.match[1]);
});

bot.callbackQuery(/^room_test:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSubjectTests(ctx, ctx.match[1]);
});

bot.callbackQuery(/^send_doc:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const mat = database.materials.find((m) => m.id === ctx.match[1]);
  if (!mat) return ctx.reply("File could not be found.");
  await ctx.replyWithDocument(mat.fileId, {
    caption: `📄 <b>${escapeHtml(mat.title)}</b>\n${escapeHtml(mat.description || "")}`,
    parse_mode: "HTML"
  });
});

bot.callbackQuery(/^send_vid:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const les = database.lessons.find((l) => l.id === ctx.match[1]);
  if (!les || !les.fileId) return ctx.reply("Video file could not be found.");
  await ctx.replyWithVideo(les.fileId, {
    caption: `🎬 <b>${escapeHtml(les.title)}</b>\n${escapeHtml(les.description || "")}`,
    parse_mode: "HTML"
  });
});

bot.callbackQuery("dash:tests", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!database.tests.length) {
    return safeEditOrReply(
      ctx,
      "📚 <b>PRACTICE TESTS</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n<i>No tests published yet.</i>",
      new InlineKeyboard().text("🏠 Back", "dash:home")
    );
  }
  const keyboard = new InlineKeyboard();
  database.tests.forEach((t) => {
    keyboard.text(`📝 ${t.title} (${t.questions.length} Qs, ${t.durationMinutes}m)`, `take:${t.id}`).row();
  });
  keyboard.text("🏠 Back", "dash:home");
  await safeEditOrReply(ctx, "📚 <b>SELECT A PRACTICE TEST:</b>", keyboard);
});

bot.callbackQuery("dash:stats", async (ctx) => {
  await ctx.answerCallbackQuery();
  const stats = getUserStats(ctx.from.id);
  const rank = getUserRank(ctx.from.id);
  let text =
    `📊 <b>MY PERFORMANCE &amp; ACADEMIC RECORD</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Student:</b> ${escapeHtml(ctx.from.first_name || "Student")}\n` +
    `🎯 <b>Tests Taken:</b> <code>${stats.totalTaken}</code>\n` +
    `📈 <b>Average Score:</b> <code>${stats.avgScore}%</code>\n` +
    `🌟 <b>Highest Score:</b> <code>${stats.highestScore}%</code>\n` +
    `🏅 <b>Class Rank:</b> <code>${rank ? `#${rank}` : "Unranked"}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 <b>Recent Attempts:</b>\n\n`;

  if (!stats.history.length) {
    text += `<i>No tests completed yet. Start practicing today!</i>\n`;
  } else {
    stats.history.forEach((h, i) => {
      text += `<b>${i + 1}. ${escapeHtml(h.testTitle)}</b>\n   Score: <b>${h.score}/${h.total}</b> (<code>${h.percentage}%</code>)\n\n`;
    });
  }

  const keyboard = new InlineKeyboard()
    .text("📝 Take a Test", "dash:tests")
    .text("🏆 Leaderboard", "dash:leaderboard")
    .row()
    .text("🏠 Back to Dashboard", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery("dash:leaderboard", async (ctx) => {
  await ctx.answerCallbackQuery();
  const leaderboard = getLeaderboard().slice(0, 10);
  const userRank = getUserRank(ctx.from.id);

  let text =
    `🏆 <b>PHOSTERS TOP CANDIDATES LEADERBOARD</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (!leaderboard.length) {
    text += `<i>No scores recorded yet. Lead the board by taking your first test!</i>\n\n`;
  } else {
    leaderboard.forEach((entry, i) => {
      let medal = `<b>#${i + 1}</b>`;
      if (i === 0) medal = "🥇 <b>1st</b>";
      else if (i === 1) medal = "🥈 <b>2nd</b>";
      else if (i === 2) medal = "🥉 <b>3rd</b>";
      const name = entry.username ? `@${escapeHtml(entry.username)}` : escapeHtml(entry.name);
      text += `${medal} ${name}\n   Avg: <b>${entry.average}%</b> | Tests: <b>${entry.testsCount}</b>\n\n`;
    });
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 <b>Your Rank:</b> ${userRank ? `<b>#${userRank}</b>` : `<i>Unranked</i>`}`;

  const keyboard = new InlineKeyboard()
    .text("🔄 Refresh", "dash:leaderboard")
    .text("📝 Take Test", "dash:tests")
    .row()
    .text("🏠 Back", "dash:home");

  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery("dash:community", async (ctx) => {
  await ctx.answerCallbackQuery();
  const url = process.env.COMMUNITY_URL;
  if (!url) return ctx.reply("Community link not configured.");
  await safeEditOrReply(
    ctx,
    `💬 <b>PHOSTERS COMMUNITY CHAT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nJoin tutors and students in live discussions:`,
    new InlineKeyboard().url("👉 Join Community Chat", url).row().text("🏠 Back", "dash:home")
  );
});

bot.callbackQuery("dash:announcements", async (ctx) => {
  await ctx.answerCallbackQuery();
  const url = process.env.ANNOUNCEMENTS_URL;
  if (!url) return ctx.reply("Announcements link not configured.");
  await safeEditOrReply(
    ctx,
    `📢 <b>PHOSTERS OFFICIAL ANNOUNCEMENTS</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nOfficial updates, timetables, and mock schedules:`,
    new InlineKeyboard().url("👉 Open Announcements Channel", url).row().text("🏠 Back", "dash:home")
  );
});

bot.callbackQuery("dash:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  const text =
    `ℹ️ <b>PHOSTERS DIGITAL ACADEMY GUIDE</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `1. <b>Register Course &amp; Combination:</b> Tap <i>Course &amp; Subject Combination</i> to lock in your 4 JAMB subjects.\n` +
    `2. <b>Classrooms:</b> Watch video lessons &amp; download PDF notes for your subjects.\n` +
    `3. <b>Mocks &amp; Tests:</b> Test yourself against the clock with automatic scoring.\n` +
    `4. <b>Digital ID Card:</b> View your official student credential.\n` +
    `5. <b>Leaderboard:</b> See where you stand among all students in the centre!`;
  await safeEditOrReply(ctx, text, new InlineKeyboard().text("🏠 Back to Dashboard", "dash:home"));
});

// ---------------- TUTOR & ADMIN HANDLERS ----------------
bot.callbackQuery("tutor:studio", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showTutorStudio(ctx);
});

bot.callbackQuery(/^tut_subj:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showTutorSubjectCockpit(ctx, ctx.match[1]);
});

bot.callbackQuery("tut_dl_tpl", async (ctx) => {
  await ctx.answerCallbackQuery();
  const buffer = generateExcelTemplateBuffer();
  await ctx.replyWithDocument(new InputFile(buffer, "Phosters_Test_Template.xlsx"), {
    caption: `📥 <b>PHOSTERS TEST TEMPLATE (.xlsx)</b>\nFill your questions and upload back to the bot!`,
    parse_mode: "HTML"
  });
});

bot.callbackQuery(/^tut_add_vid:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subjectId = ctx.match[1];
  if (!canManageSubject(ctx, subjectId)) return ctx.reply("Unauthorized.");
  adminFlows.set(ctx.from.id, { type: "add-video-title", subjectId });
  await ctx.reply(`🎬 <b>ADD VIDEO LESSON (Step 1/2)</b>\nSend lesson title (e.g. <i>Cell Structure</i>):`, { parse_mode: "HTML" });
});

bot.callbackQuery(/^tut_add_mat:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subjectId = ctx.match[1];
  if (!canManageSubject(ctx, subjectId)) return ctx.reply("Unauthorized.");
  adminFlows.set(ctx.from.id, { type: "add-material-title", subjectId });
  await ctx.reply(`📄 <b>UPLOAD STUDY NOTES / PDF (Step 1/2)</b>\nSend handout title:`, { parse_mode: "HTML" });
});

bot.callbackQuery(/^tut_add_test:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subjectId = ctx.match[1];
  if (!canManageSubject(ctx, subjectId)) return ctx.reply("Unauthorized.");
  adminFlows.set(ctx.from.id, { type: "test-title", subjectId });
  await ctx.reply(`📝 <b>PUBLISH PRACTICE TEST (Step 1/3)</b>\nSend test title:`, { parse_mode: "HTML" });
});

bot.callbackQuery(/^tut_load_demo:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subjectId = ctx.match[1];
  if (!canManageSubject(ctx, subjectId)) return ctx.reply("Unauthorized.");
  const subject = database.subjects.find((s) => s.id === subjectId);

  const demoTest = {
    id: newId("test"),
    subjectId,
    title: `${subject?.name || "Subject"} Diagnostic Mock 1`,
    durationMinutes: 10,
    creatorId: String(ctx.from.id),
    createdAt: new Date().toISOString(),
    questions: [
      {
        question: "Which organelle generates cellular energy (ATP)?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic reticulum"],
        correctAnswer: "B"
      },
      {
        question: "What is the primary gas released during the light stage of photosynthesis?",
        options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Methane"],
        correctAnswer: "B"
      },
      {
        question: "In standard genetics, a monohybrid cross of Bb x Bb yields what phenotypic ratio?",
        options: ["1:1", "3:1", "9:3:3:1", "2:1"],
        correctAnswer: "B"
      }
    ]
  };

  database.tests.push(demoTest);
  await saveDatabase();
  await broadcastTestPublished(demoTest);

  await ctx.reply(
    `⚡ <b>STARTER MOCK PUBLISHED!</b>\n` +
    `• <b>Test:</b> ${escapeHtml(demoTest.title)}\n` +
    `• <b>Questions:</b> 3\n` +
    `• <b>Duration:</b> 10 mins`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text(`🔙 Back to ${subject?.name}`, `tut_subj:${subjectId}`)
    }
  );
});

bot.callbackQuery(/^tut_scores:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const subjectId = ctx.match[1];
  const subject = database.subjects.find((s) => s.id === subjectId);
  const results = database.results.filter((r) => r.subjectId === subjectId);

  if (!results.length) {
    return safeEditOrReply(
      ctx,
      `📊 <b>SUBMISSIONS: ${escapeHtml(subject?.name || "")}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n<i>No submissions recorded yet for this subject.</i>`,
      new InlineKeyboard().text("🔙 Back", `tut_subj:${subjectId}`)
    );
  }

  const lines = results.slice(-15).reverse().map((r, i) => {
    const student = r.username ? `@${escapeHtml(r.username)}` : escapeHtml(r.firstName || r.userId);
    return `<b>${i + 1}. ${escapeHtml(r.testTitle)}</b>\n   👤 ${student} — Score: <b>${r.score}/${r.total}</b> (<code>${r.percentage}%</code>)`;
  });

  await safeEditOrReply(
    ctx,
    `📊 <b>STUDENT RESULTS: ${escapeHtml(subject?.name || "")}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` + lines.join("\n\n"),
    new InlineKeyboard().text("🔙 Back", `tut_subj:${subjectId}`)
  );
});

// Admin Callbacks
bot.callbackQuery("admin:dashboard", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return ctx.reply("⛔ Head Admin only.");
  const { text, keyboard } = renderAdminDashboard();
  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery("admin:tutors", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showTutorsList(ctx);
});

bot.callbackQuery("admin:new_invite", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showInviteSubjectPicker(ctx);
});

bot.callbackQuery(/^gen_inv:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;

  const target = ctx.match[1];
  const subjectIds = target === "all" ? ["all"] : [target];
  const inviteCode = "inv_" + randomBytes(4).toString("hex");

  database.tutorInvites.push({
    code: inviteCode,
    subjectIds,
    createdBy: String(ctx.from.id),
    createdAt: new Date().toISOString(),
    redeemed: false
  });
  await saveDatabase();

  const botInfo = await bot.api.getMe();
  const inviteUrl = `https://t.me/${botInfo.username}?start=${inviteCode}`;
  const subjName = target === "all" ? "All Subjects (General Tutor)" : database.subjects.find((s) => s.id === target)?.name;

  await ctx.reply(
    `🎉 <b>1-CLICK TUTOR INVITE LINK GENERATED!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 <b>Assigned Subject:</b> ${escapeHtml(subjName)}\n\n` +
    `Send this link to your tutor on WhatsApp or Telegram:\n\n` +
    `<code>${inviteUrl}</code>\n\n` +
    `<i>When the tutor taps this link and clicks 'Start', they will automatically be granted Tutor Studio access!</i>`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("🔙 Back to Tutors List", "admin:tutors")
    }
  );
});
bot.callbackQuery("admin:add_tutor_id", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return ctx.reply("⛔ Head Admin only.");
  adminFlows.set(ctx.from.id, { type: "add-tutor-userid" });
  await ctx.reply(
    `➕ <b>ADD TUTOR BY TELEGRAM ID (Step 1/2)</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Please send the <b>Telegram ID</b> of the tutor (e.g. <code>123456789</code>):\n\n` +
    `<i>(Tip: The tutor can send /myid to the bot to see their numeric ID)</i>`,
    { parse_mode: "HTML" }
  );
});

bot.callbackQuery(/^set_tut_sub:(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;
  const [, targetUserId, subjId] = ctx.match;
  const subjIds = subjId === "all" ? ["all"] : [subjId];

  let tutor = database.tutors.find((t) => t.userId === targetUserId);
  if (!tutor) {
    tutor = {
      userId: targetUserId,
      name: "Tutor",
      role: "tutor",
      subjects: subjIds
    };
    database.tutors.push(tutor);
  } else {
    tutor.subjects = subjIds;
  }
  await saveDatabase();
  adminFlows.delete(ctx.from.id);

  const subjName = subjId === "all" ? "All Subjects" : database.subjects.find((s) => s.id === subjId)?.name;
  await safeEditOrReply(
    ctx,
    `✅ <b>TUTOR APPOINTED SUCCESSFULLY!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• <b>Tutor ID:</b> <code>${targetUserId}</code>\n` +
    `• <b>Subject:</b> ${subjName}\n\n` +
    `This tutor can now send <b>/tutor</b> to access their management studio!`,
    new InlineKeyboard().text("👥 View All Tutors", "admin:tutors").row().text("👑 Admin Cockpit", "admin:dashboard")
  );
});

bot.callbackQuery("admin:remove_tutor_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;

  const nonHeadAdmins = database.tutors.filter((t) => t.role !== "head_admin" && !ADMIN_IDS.has(t.userId));
  if (!nonHeadAdmins.length) {
    return safeEditOrReply(
      ctx,
      "No appointed subject tutors to remove.",
      new InlineKeyboard().text("🔙 Back to Tutors", "admin:tutors")
    );
  }

  const text =
    `🗑 <b>REMOVE A TUTOR</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Select a tutor to revoke their access:`;

  const keyboard = new InlineKeyboard();
  nonHeadAdmins.forEach((t) => {
    keyboard.text(`❌ Remove: ${t.name} (${t.userId})`, `rm_tut:${t.userId}`).row();
  });
  keyboard.text("🔙 Cancel", "admin:tutors");

  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery(/^rm_tut:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;
  const targetId = ctx.match[1];
  const idx = database.tutors.findIndex((t) => t.userId === targetId);
  if (idx >= 0) {
    const removed = database.tutors.splice(idx, 1)[0];
    await saveDatabase();
    await ctx.reply(`🗑 Tutor access revoked for <b>${escapeHtml(removed.name)}</b> (<code>${removed.userId}</code>).`, { parse_mode: "HTML" });
  }
  await showTutorsList(ctx);
});

bot.callbackQuery("admin:tests", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;
  if (!database.tests.length) {
    return safeEditOrReply(ctx, "No tests published in system.", new InlineKeyboard().text("🔙 Admin Cockpit", "admin:dashboard"));
  }
  let text = `📋 <b>ALL PUBLISHED TESTS (${database.tests.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  database.tests.forEach((t, i) => {
    const subj = database.subjects.find((s) => s.id === t.subjectId);
    text += `<b>${i + 1}. ${escapeHtml(t.title)}</b> (${subj?.name || "General"} | Qs: ${t.questions.length} | ⏱ ${t.durationMinutes}m)\n`;
  });
  await safeEditOrReply(
    ctx,
    text.slice(0, 4000),
    new InlineKeyboard().text("🗑 Delete a Test", "admin:delete_menu").row().text("🔙 Admin Cockpit", "admin:dashboard")
  );
});

bot.callbackQuery("admin:delete_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;
  if (!database.tests.length) {
    return safeEditOrReply(ctx, "No tests to delete.", new InlineKeyboard().text("🔙 Admin Cockpit", "admin:dashboard"));
  }
  const keyboard = new InlineKeyboard();
  database.tests.forEach((t) => {
    keyboard.text(`🗑 ${t.title}`, `del:${t.id}`).row();
  });
  keyboard.text("🔙 Cancel", "admin:dashboard");
  await safeEditOrReply(ctx, "⚠️ Select a test to delete permanently:", keyboard);
});

bot.callbackQuery(/^del:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;
  const testId = ctx.match[1];
  const idx = database.tests.findIndex((t) => t.id === testId);
  if (idx >= 0) {
    const deleted = database.tests.splice(idx, 1)[0];
    await saveDatabase();
    await ctx.reply(`🗑 Test "<b>${escapeHtml(deleted.title)}</b>" removed.`, { parse_mode: "HTML" });
  }
  const { text, keyboard } = renderAdminDashboard();
  await safeEditOrReply(ctx, text, keyboard);
});

bot.callbackQuery("admin:results", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isHeadAdmin(ctx)) return;
  if (!database.results.length) {
    return safeEditOrReply(ctx, "No submissions yet.", new InlineKeyboard().text("🔙 Admin Cockpit", "admin:dashboard"));
  }
  const lines = database.results.slice(-15).reverse().map((r, i) => {
    const student = r.username ? `@${escapeHtml(r.username)}` : escapeHtml(r.firstName || r.userId);
    return `<b>${i + 1}. ${escapeHtml(r.testTitle)}</b>\n   👤 ${student} — <b>${r.score}/${r.total}</b> (${r.percentage}%)`;
  });
  await safeEditOrReply(
    ctx,
    `📈 <b>CENTRE-WIDE RECENT SUBMISSIONS</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` + lines.join("\n\n"),
    new InlineKeyboard().text("🔙 Admin Cockpit", "admin:dashboard")
  );
});

// Test Execution Callbacks
bot.callbackQuery(/^take:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const testId = ctx.match[1];
  const test = database.tests.find((t) => t.id === testId);
  if (!test) return ctx.reply("⚠️ Test not found.");
  await startTest(ctx, test);
});

bot.callbackQuery(/^ans:(.+):(\d+):([A-D])$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const [, testId, indexStr, selectedLetter] = ctx.match;
  const index = parseInt(indexStr, 10);
  const key = sessionKey(ctx.from.id, testId);
  const session = activeSessions.get(key);
  const test = database.tests.find((t) => t.id === testId);

  if (!session || !test || session.finished) {
    return ctx.reply("⚠️ This test session is no longer active. Use the dashboard to begin.");
  }

  session.answers[index] = selectedLetter;
  const nextIndex = index + 1;

  if (nextIndex < test.questions.length) {
    session.currentQuestion = nextIndex;
    const { text, keyboard } = renderQuestionScreen(test, nextIndex);
    await safeEditOrReply(ctx, text, keyboard);
  } else {
    await finishTest(ctx, test, session, false);
  }
});

bot.callbackQuery(/^rev:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showCorrections(ctx, ctx.match[1]);
});

// ---------------- MESSAGE HANDLERS ----------------
bot.on("message:text", async (ctx, next) => {
  if (!isTutor(ctx)) return next();
  const flow = adminFlows.get(ctx.from.id);
  if (!flow) return next();

  const text = ctx.message.text.trim();

  if (flow.type === "add-tutor-userid") {
    const targetUserId = text.replace(/[^0-9]/g, "");
    if (!targetUserId) {
      await ctx.reply("Please enter a valid numeric Telegram ID (e.g. 123456789):");
      return;
    }
    flow.targetUserId = targetUserId;
    flow.type = "add-tutor-subject";

    const textPrompt =
      `🏛 <b>ASSIGN SUBJECT TO TUTOR (Step 2/2)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Tutor ID: <code>${targetUserId}</code>\n\n` +
      `Select which subject this tutor will teach:`;

    const keyboard = new InlineKeyboard();
    database.subjects.forEach((subj, i) => {
      keyboard.text(`${subj.icon} ${subj.name}`, `set_tut_sub:${targetUserId}:${subj.id}`);
      if (i % 2 === 1) keyboard.row();
    });
    if (database.subjects.length % 2 !== 0) keyboard.row();
    keyboard.text("🌟 All Subjects (General Tutor)", `set_tut_sub:${targetUserId}:all`).row();
    keyboard.text("🔙 Cancel", "admin:tutors");

    await ctx.reply(textPrompt, { parse_mode: "HTML", reply_markup: keyboard });
    return;
  }

  if (flow.type === "add-video-title") {
    flow.title = text;
    flow.type = "add-video-source";
    await ctx.reply(
      `🎬 <b>ADD VIDEO LESSON (Step 2/2)</b>\n` +
      `Title: <b>${escapeHtml(text)}</b>\n\n` +
      `👉 Send a <b>YouTube URL</b> or directly upload a <b>Video file</b> right now!`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (flow.type === "add-video-source") {
    const isUrl = /^https?:\/\//i.test(text);
    if (!isUrl) {
      await ctx.reply("Please paste a valid YouTube or video URL, or upload a video file.");
      return;
    }
    const lesson = {
      id: newId("les"),
      subjectId: flow.subjectId,
      title: flow.title,
      type: "youtube",
      url: text,
      fileId: null,
      tutorId: String(ctx.from.id),
      tutorName: ctx.from.first_name || "Tutor",
      createdAt: new Date().toISOString()
    };
    database.lessons.push(lesson);
    await saveDatabase();
    await broadcastVideoPublished(lesson);
    adminFlows.delete(ctx.from.id);

    await ctx.reply(
      `✅ <b>VIDEO LESSON PUBLISHED!</b>\n` +
      `• <b>Title:</b> ${escapeHtml(lesson.title)}\n` +
      `• <b>Link:</b> ${text}`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("🔙 Back to Classroom", `tut_subj:${flow.subjectId}`)
      }
    );
    return;
  }

  if (flow.type === "add-material-title") {
    flow.title = text;
    flow.type = "add-material-file";
    await ctx.reply(`📄 <b>UPLOAD STUDY NOTES (Step 2/2)</b>\nPlease upload the <b>PDF / Word document</b> now!`, { parse_mode: "HTML" });
    return;
  }

  if (flow.type === "test-title") {
    flow.title = text;
    flow.type = "test-duration";
    await ctx.reply(`⏱ <b>CREATE TEST (Step 2/3)</b>\nEnter duration in <b>minutes</b> (e.g. <code>15</code>):`, { parse_mode: "HTML" });
    return;
  }

  if (flow.type === "test-duration") {
    const duration = parseInt(text, 10);
    if (isNaN(duration) || duration <= 0) {
      await ctx.reply("Please enter a positive number of minutes (e.g. 15):");
      return;
    }
    flow.duration = duration;
    flow.type = "test-questions";

    await ctx.reply(
      `📋 <b>ADD QUESTIONS (Step 3/3)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Copy-paste questions directly or upload an Excel / CSV spreadsheet!`,
      { parse_mode: "HTML" }
    );
    return;
  }

  if (flow.type === "test-questions") {
    try {
      const questions = parseSmartTextQuestions(text);
      const test = {
        id: newId("test"),
        subjectId: flow.subjectId,
        title: flow.title,
        durationMinutes: flow.duration,
        questions,
        creatorId: String(ctx.from.id),
        createdAt: new Date().toISOString()
      };
      database.tests.push(test);
      await saveDatabase();
      await broadcastTestPublished(test);
      adminFlows.delete(ctx.from.id);

      await ctx.reply(
        `✅ <b>TEST PUBLISHED SUCCESSFULLY!</b>\n` +
        `• <b>Title:</b> ${escapeHtml(test.title)}\n` +
        `• <b>Questions:</b> ${test.questions.length}\n` +
        `• <b>Duration:</b> ${test.durationMinutes} mins`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text("🔙 Back to Tutor Cockpit", `tut_subj:${flow.subjectId}`)
        }
      );
    } catch (err) {
      await ctx.reply(`❌ <b>Question Parsing Error:</b>\n${escapeHtml(err.message)}`, { parse_mode: "HTML" });
    }
    return;
  }

  return next();
});

bot.on("message:document", async (ctx) => {
  if (!isTutor(ctx)) return;
  const flow = adminFlows.get(ctx.from.id);
  if (!flow) return;

  const doc = ctx.message.document;

  if (flow.type === "add-material-file") {
    const material = {
      id: newId("mat"),
      subjectId: flow.subjectId,
      title: flow.title,
      fileId: doc.file_id,
      fileName: doc.file_name || "Study_Notes.pdf",
      fileSize: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : "Unknown",
      tutorId: String(ctx.from.id),
      tutorName: ctx.from.first_name || "Tutor",
      createdAt: new Date().toISOString()
    };
    database.materials.push(material);
    await saveDatabase();
    await broadcastMaterialPublished(material);
    adminFlows.delete(ctx.from.id);

    await ctx.reply(
      `✅ <b>STUDY MATERIAL SAVED!</b>\n` +
      `• <b>Title:</b> ${escapeHtml(material.title)}\n` +
      `• <b>File:</b> ${escapeHtml(material.fileName)} (${material.fileSize})`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text("🔙 Back to Classroom", `tut_subj:${flow.subjectId}`)
      }
    );
    return;
  }

  if (flow.type === "test-questions") {
    try {
      const file = await ctx.getFile();
      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Could not download spreadsheet from Telegram.");

      const buffer = Buffer.from(await response.arrayBuffer());
      const questions = parseSpreadsheet(buffer);

      const test = {
        id: newId("test"),
        subjectId: flow.subjectId,
        title: flow.title,
        durationMinutes: flow.duration,
        questions,
        creatorId: String(ctx.from.id),
        createdAt: new Date().toISOString()
      };
      database.tests.push(test);
      await saveDatabase();
      await broadcastTestPublished(test);
      adminFlows.delete(ctx.from.id);

      await ctx.reply(
        `✅ <b>SPREADSHEET TEST IMPORTED!</b>\n` +
        `• <b>Title:</b> ${escapeHtml(test.title)}\n` +
        `• <b>Questions:</b> ${test.questions.length}\n` +
        `• <b>Duration:</b> ${test.durationMinutes} mins`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().text("🔙 Back to Tutor Cockpit", `tut_subj:${flow.subjectId}`)
        }
      );
    } catch (err) {
      await ctx.reply(`❌ <b>Import Failed:</b> ${escapeHtml(err.message)}`, { parse_mode: "HTML" });
    }
    return;
  }
});

bot.on("message:video", async (ctx) => {
  if (!isTutor(ctx)) return;
  const flow = adminFlows.get(ctx.from.id);
  if (!flow || flow.type !== "add-video-source") return;

  const vid = ctx.message.video;
  const lesson = {
    id: newId("les"),
    subjectId: flow.subjectId,
    title: flow.title,
    type: "video",
    url: null,
    fileId: vid.file_id,
    tutorId: String(ctx.from.id),
    tutorName: ctx.from.first_name || "Tutor",
    createdAt: new Date().toISOString()
  };
  database.lessons.push(lesson);
  await saveDatabase();
  await broadcastVideoPublished(lesson);
  adminFlows.delete(ctx.from.id);

  await ctx.reply(
    `✅ <b>VIDEO LECTURE SAVED!</b>\n` +
    `• <b>Title:</b> ${escapeHtml(lesson.title)}`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("🔙 Back to Classroom", `tut_subj:${flow.subjectId}`)
    }
  );
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

async function main() {
  await loadDatabase();

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "🏠 Open Student Dashboard" },
      { command: "subjects", description: "🎯 Select 4 JAMB Subjects" },
      { command: "classrooms", description: "🏛 Subject Videos & PDF Notes" },
      { command: "tests", description: "📝 Practice Mock Tests" },
      { command: "id", description: "👤 Digital Student ID Card" },
      { command: "stats", description: "📊 Check Scores & Academic Record" },
      { command: "leaderboard", description: "🏆 Centre Top Candidates" },
      { command: "tutor", description: "🧑‍🏫 Tutor Management Studio" },
      { command: "admin", description: "👑 Head Administrator Cockpit" },
      { command: "help", description: "📖 All Available Commands" }
    ]);
  } catch (err) {
    console.error("Could not register bot commands menu:", err.message);
  }

  const PORT = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phosters Bot Status</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 400px; border: 1px solid #334155; }
            .badge { background: #10b981; color: #fff; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; display: inline-block; margin-bottom: 1rem; }
            h1 { font-size: 1.5rem; margin: 0.5rem 0; color: #38bdf8; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
            a { color: #38bdf8; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● ONLINE 24/7</span>
            <h1>Phosters Academy</h1>
            <p>Telegram Digital Learning & CBT Mock Exam Bot</p>
            <p>Running live: <a href="https://t.me/Ph0sterbot" target="_blank">@Ph0sterbot</a></p>
          </div>
        </body>
      </html>
    `);
  });

  server.listen(PORT, () => {
    console.log(`Web healthcheck server listening on port ${PORT}`);
  });

  bot.start({
    onStart: (botInfo) => {
      console.log(`Phosters Digital Academy Bot @${botInfo.username} is running...`);
    }
  });
}

main().catch((err) => {
  console.error("Failed to start bot:", err);
});
