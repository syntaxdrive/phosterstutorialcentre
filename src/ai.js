import https from "node:https";

const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();
const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";

/**
 * Low-level call to Groq API using native node:https
 */
export async function callGroq(messages, { json = false, temperature = 0.5, maxTokens = 3500 } = {}) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables.");
  }
  const payload = {
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens
  };

  if (json) {
    payload.response_format = { type: "json_object" };
  }

  const data = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.groq.com",
        port: 443,
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "User-Agent": "PhostersAcademyBot/1.0"
        },
        timeout: 25000
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Groq API returned status ${res.statusCode}: ${body.slice(0, 200)}`));
          }
          try {
            const parsed = JSON.parse(body);
            const content = parsed.choices?.[0]?.message?.content || "";
            resolve(content);
          } catch (err) {
            reject(new Error(`Failed to parse Groq response JSON: ${err.message}`));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Groq API request timed out"));
    });

    req.on("error", (err) => reject(err));
    req.write(data);
    req.end();
  });
}

/**
 * System prompt that defines Phosters AI Academy Intelligence
 */
const SYSTEM_PROMPT = `You are Phosters AI, the premier academic intelligence engine of Phosters Tutorial Centre in Nigeria.
You specialize in preparing Nigerian secondary school students for JAMB UTME, WAEC SSCE, NECO, and University Post-UTME mock exams.

You serve two kinds of users:
1. TUTORS & ADMINS: Educators who want you to create tests, quizzes, lesson plans, mock exam papers, or academic notes.
2. STUDENTS: Secondary school candidates preparing for JAMB UTME who need step-by-step explanations, math/physics/chemistry problem solving, literature novel breakdowns (e.g., The Life Changer), and syllabus guidance.

Valid Subject IDs in Phosters Academy:
- english (Use of English)
- maths (Mathematics)
- further_maths (Further Mathematics)
- biology (Biology)
- physics (Physics)
- chemistry (Chemistry)
- crs (Christian Religious Studies)
- literature (Literature in English)
- government (Government)
- economics (Economics)

When a TUTOR requests a test/quiz (e.g. "set 5 questions on photosynthesis", "create a mock exam on calculus 10 mins", "physics vectors test"):
Your intent is "CREATE_QUIZ". Return a strictly valid JSON object matching this schema:
{
  "intent": "CREATE_QUIZ",
  "subjectId": "one of the valid subject IDs above",
  "title": "Clear concise title (e.g. Biology: Photosynthesis & Plant Nutrition)",
  "topic": "Specific topic",
  "timeMinutes": number (default 10 if unspecified),
  "questions": [
    {
      "text": "Question text conforming to authentic JAMB UTME multiple-choice standard",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctIndex": 0 | 1 | 2 | 3,
      "explanation": "Clear step-by-step explanation why this option is correct and how to solve it."
    }
  ]
}

When a TUTOR asks for a lesson note or study guide (e.g. "write lesson note on genetics", "summary of economic systems"):
Your intent is "LESSON_NOTE". Return a strictly valid JSON object:
{
  "intent": "LESSON_NOTE",
  "subjectId": "one of the valid subject IDs",
  "title": "Topic Title",
  "content": "Rich markdown lesson notes with Key Definitions, Formulas/Principles, Common JAMB Exam Pitfalls, and Worked Examples."
}

When a STUDENT asks an academic question (e.g. "how do I solve 2x + 5 = 15", "explain projectile motion", "who killed Banquo", "what is photosynthesis"):
Your intent is "ACADEMIC_CHAT". Return a strictly valid JSON object:
{
  "intent": "ACADEMIC_CHAT",
  "response": "Clear, encouraging, step-by-step explanation formatted with emojis, bullet points, formulas, and a short 'JAMB Tip' at the end."
}

When a STUDENT or USER asks for a practice drill (e.g. "test me on English", "give me 3 questions on chemistry"):
Your intent is "STUDENT_DRILL". Return a strictly valid JSON object:
{
  "intent": "STUDENT_DRILL",
  "subjectId": "valid subject id",
  "topic": "topic name",
  "questions": [
    {
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0 | 1 | 2 | 3,
      "explanation": "Brief explanation"
    }
  ]
}

If user is just saying hi or chatting generally:
Your intent is "GENERAL_CHAT". Return a strictly valid JSON object:
{
  "intent": "GENERAL_CHAT",
  "response": "Friendly message greeting the user, mentioning you are Phosters Academy AI, and suggesting what they can ask."
}
`;

/**
 * Natural language intent parser and handler
 */
export async function processNaturalLanguage({ text, user, isTutorUser, enrolledSubjects = [] }) {
  const roleDesc = isTutorUser ? "TUTOR/ADMINISTRATOR" : "STUDENT";
  const userContext = `User Role: ${roleDesc}. User Name: ${user?.first_name || "Scholar"}. Enrolled/Assigned Subjects: ${enrolledSubjects.join(", ") || "General"}.`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `${userContext}\n\nUser Message: "${text}"` }
  ];

  const rawJson = await callGroq(messages, { json: true, temperature: 0.4 });
  try {
    return JSON.parse(rawJson);
  } catch (err) {
    // If JSON parsing fails, wrap raw content in general chat
    return {
      intent: "ACADEMIC_CHAT",
      response: rawJson
    };
  }
}

/**
 * AI Question Explainer for failed test review
 */
export async function getQuestionExplanation({ questionText, options, studentAnswer, correctAnswer, subjectName = "JAMB Subject" }) {
  const prompt = `You are a high-level JAMB UTME tutor at Phosters Academy.
Subject: ${subjectName}
Question: ${questionText}
Options:
A) ${options[0]}
B) ${options[1]}
C) ${options[2]}
D) ${options[3]}

Candidate selected: Option ${studentAnswer} (${options[studentAnswer] || "None"})
Correct answer is: Option ${correctAnswer} (${options[correctAnswer]})

Provide a friendly, concise, step-by-step breakdown explaining:
1. Why Option ${correctAnswer} is the 100% correct answer.
2. The specific misconception that makes candidates choose other options.
3. A quick memory mnemonic or formula shortcut to remember for the actual exam day.
Keep it under 180 words, formatted with bullet points and bold highlights.`;

  return callGroq(
    [
      { role: "system", content: "You are Phosters Academy's top exam tutor. Provide concise, high-yield explanations." },
      { role: "user", content: prompt }
    ],
    { json: false, temperature: 0.3 }
  );
}
