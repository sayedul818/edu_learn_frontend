// ==================== QUESTIONS ====================
export interface Question {
  id: string;
  subject: string;
  chapter: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "MCQ" | "CQ" | "Written";
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  createdBy: string;
}

export const subjects = ["Physics", "Chemistry", "Biology", "Math", "English", "Bangla", "ICT", "General Knowledge"];
export const chapters: Record<string, string[]> = {
  Physics: ["Motion", "Force", "Energy", "Waves", "Optics", "Electricity"],
  Chemistry: ["Atomic Structure", "Chemical Bonds", "Organic Chemistry", "Acids & Bases"],
  Biology: ["Cell Biology", "Genetics", "Ecology", "Human Body"],
  Math: ["Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics"],
  English: ["Grammar", "Vocabulary", "Comprehension", "Essay"],
  Bangla: ["ব্যাকরণ", "সাহিত্য", "রচনা"],
  ICT: ["Computer Basics", "Networking", "Programming", "Databases"],
  "General Knowledge": ["Bangladesh", "International", "Science", "Current Affairs"],
};

export const mockQuestions: Question[] = [
  { id: "q1", subject: "Physics", chapter: "Motion", difficulty: "Easy", type: "MCQ", questionText: "What is the SI unit of velocity?", options: ["m/s", "km/h", "m/s²", "N"], correctAnswer: "m/s", explanation: "Velocity is displacement per unit time. SI unit is meters per second (m/s).", marks: 1, createdBy: "t1" },
  { id: "q2", subject: "Physics", chapter: "Force", difficulty: "Medium", type: "MCQ", questionText: "Newton's second law states that F = ?", options: ["ma", "mv", "mg", "mgh"], correctAnswer: "ma", explanation: "Force equals mass times acceleration (F = ma).", marks: 1, createdBy: "t1" },
  { id: "q3", subject: "Chemistry", chapter: "Atomic Structure", difficulty: "Easy", type: "MCQ", questionText: "How many electrons can the first shell hold?", options: ["2", "4", "8", "16"], correctAnswer: "2", explanation: "The first electron shell (K shell) can hold a maximum of 2 electrons.", marks: 1, createdBy: "t1" },
  { id: "q4", subject: "Chemistry", chapter: "Chemical Bonds", difficulty: "Hard", type: "MCQ", questionText: "Which bond is formed by sharing electrons?", options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], correctAnswer: "Covalent", explanation: "Covalent bonds are formed when atoms share electron pairs.", marks: 1, createdBy: "t1" },
  { id: "q5", subject: "Math", chapter: "Algebra", difficulty: "Easy", type: "MCQ", questionText: "Solve: 2x + 6 = 10", options: ["x = 2", "x = 3", "x = 4", "x = 8"], correctAnswer: "x = 2", explanation: "2x = 10 - 6 = 4, so x = 2.", marks: 1, createdBy: "t1" },
  { id: "q6", subject: "Math", chapter: "Geometry", difficulty: "Medium", type: "MCQ", questionText: "Area of a circle with radius r is?", options: ["πr²", "2πr", "πd", "2πr²"], correctAnswer: "πr²", explanation: "The area of a circle is π times the square of the radius.", marks: 1, createdBy: "t1" },
  { id: "q7", subject: "Biology", chapter: "Cell Biology", difficulty: "Easy", type: "MCQ", questionText: "Which organelle is the powerhouse of the cell?", options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi body"], correctAnswer: "Mitochondria", explanation: "Mitochondria produce ATP, the cell's energy currency.", marks: 1, createdBy: "t1" },
  { id: "q8", subject: "Biology", chapter: "Genetics", difficulty: "Hard", type: "MCQ", questionText: "DNA replication is:", options: ["Semi-conservative", "Conservative", "Dispersive", "Random"], correctAnswer: "Semi-conservative", explanation: "Each new DNA molecule contains one old and one new strand.", marks: 1, createdBy: "t1" },
  { id: "q9", subject: "English", chapter: "Grammar", difficulty: "Easy", type: "MCQ", questionText: "Choose the correct form: She ___ to school daily.", options: ["goes", "go", "going", "gone"], correctAnswer: "goes", explanation: "Third person singular present tense uses 'goes'.", marks: 1, createdBy: "t1" },
  { id: "q10", subject: "ICT", chapter: "Computer Basics", difficulty: "Easy", type: "MCQ", questionText: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], correctAnswer: "Central Processing Unit", explanation: "CPU = Central Processing Unit, the brain of the computer.", marks: 1, createdBy: "t1" },
  { id: "q11", subject: "Physics", chapter: "Energy", difficulty: "Medium", type: "MCQ", questionText: "Kinetic energy formula is?", options: ["½mv²", "mgh", "Fd", "mv"], correctAnswer: "½mv²", explanation: "KE = ½ × mass × velocity².", marks: 1, createdBy: "t1" },
  { id: "q12", subject: "General Knowledge", chapter: "Bangladesh", difficulty: "Easy", type: "MCQ", questionText: "When did Bangladesh gain independence?", options: ["1971", "1952", "1947", "1975"], correctAnswer: "1971", explanation: "Bangladesh became independent on 26 March 1971.", marks: 1, createdBy: "t1" },
];

// ==================== EXAMS ====================
export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number; // minutes
  totalMarks: number;
  negativeMarking: boolean;
  negativeMarkValue: number;
  questionIds: string[];
  createdBy: string;
  status: "draft" | "published" | "completed";
  createdAt: string;
}

export const mockExams: Exam[] = [
  { id: "e1", title: "Physics Chapter Test - Motion & Force", subject: "Physics", duration: 30, totalMarks: 4, negativeMarking: true, negativeMarkValue: 0.25, questionIds: ["q1", "q2", "q11", "q4"], createdBy: "t1", status: "published", createdAt: "2026-02-10" },
  { id: "e2", title: "Chemistry Fundamentals", subject: "Chemistry", duration: 20, totalMarks: 2, negativeMarking: false, negativeMarkValue: 0, questionIds: ["q3", "q4"], createdBy: "t1", status: "published", createdAt: "2026-02-12" },
  { id: "e3", title: "Math Quick Test", subject: "Math", duration: 15, totalMarks: 2, negativeMarking: false, negativeMarkValue: 0, questionIds: ["q5", "q6"], createdBy: "t1", status: "published", createdAt: "2026-02-14" },
  { id: "e4", title: "Biology Cell & Genetics", subject: "Biology", duration: 25, totalMarks: 2, negativeMarking: true, negativeMarkValue: 0.5, questionIds: ["q7", "q8"], createdBy: "t1", status: "published", createdAt: "2026-02-15" },
  { id: "e5", title: "General Knowledge - Bangladesh", subject: "General Knowledge", duration: 10, totalMarks: 1, negativeMarking: false, negativeMarkValue: 0, questionIds: ["q12"], createdBy: "t1", status: "draft", createdAt: "2026-02-16" },
];

// ==================== RESULTS ====================
export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number; // seconds
  submittedAt: string;
}

export const mockResults: ExamResult[] = [
  { id: "r1", examId: "e1", studentId: "s1", studentName: "Rahim Ahmed", answers: { q1: "m/s", q2: "ma", q11: "½mv²", q4: "Covalent" }, score: 4, totalMarks: 4, percentage: 100, timeTaken: 1200, submittedAt: "2026-02-11" },
  { id: "r2", examId: "e2", studentId: "s1", studentName: "Rahim Ahmed", answers: { q3: "2", q4: "Ionic" }, score: 1, totalMarks: 2, percentage: 50, timeTaken: 800, submittedAt: "2026-02-13" },
  { id: "r3", examId: "e3", studentId: "s1", studentName: "Rahim Ahmed", answers: { q5: "x = 2", q6: "πr²" }, score: 2, totalMarks: 2, percentage: 100, timeTaken: 600, submittedAt: "2026-02-14" },
  { id: "r4", examId: "e1", studentId: "s2", studentName: "Fatima Khan", answers: { q1: "m/s", q2: "mv", q11: "½mv²", q4: "Covalent" }, score: 3, totalMarks: 4, percentage: 75, timeTaken: 1500, submittedAt: "2026-02-11" },
  { id: "r5", examId: "e1", studentId: "s3", studentName: "Arif Hossain", answers: { q1: "km/h", q2: "ma", q11: "mgh", q4: "Ionic" }, score: 1, totalMarks: 4, percentage: 25, timeTaken: 900, submittedAt: "2026-02-12" },
];

// ==================== LEADERBOARD ====================
export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  totalScore: number;
  examsCompleted: number;
  avgPercentage: number;
}

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, studentId: "s1", name: "Rahim Ahmed", totalScore: 7, examsCompleted: 3, avgPercentage: 83 },
  { rank: 2, studentId: "s4", name: "Nusrat Jahan", totalScore: 6, examsCompleted: 3, avgPercentage: 78 },
  { rank: 3, studentId: "s2", name: "Fatima Khan", totalScore: 5, examsCompleted: 2, avgPercentage: 75 },
  { rank: 4, studentId: "s5", name: "Tanvir Islam", totalScore: 4, examsCompleted: 2, avgPercentage: 70 },
  { rank: 5, studentId: "s3", name: "Arif Hossain", totalScore: 3, examsCompleted: 2, avgPercentage: 55 },
  { rank: 6, studentId: "s6", name: "Mitu Akter", totalScore: 3, examsCompleted: 1, avgPercentage: 50 },
  { rank: 7, studentId: "s7", name: "Sakib Uddin", totalScore: 2, examsCompleted: 1, avgPercentage: 45 },
  { rank: 8, studentId: "s8", name: "Riya Das", totalScore: 2, examsCompleted: 2, avgPercentage: 40 },
];

// ==================== ADMIN STATS ====================
export const adminStats = {
  totalStudents: 1247,
  totalTeachers: 38,
  totalQuestions: 4520,
  totalExams: 312,
  activeUsers: 856,
  revenue: 245000,
  monthlyGrowth: 12.5,
  platformUptime: 99.9,
};

export const recentUsers = [
  { id: "s9", name: "Kamal Haque", email: "kamal@mail.com", role: "student" as const, joinedAt: "2026-02-16", status: "active" as const },
  { id: "s10", name: "Sadia Rahman", email: "sadia@mail.com", role: "student" as const, joinedAt: "2026-02-15", status: "active" as const },
  { id: "t2", name: "Prof. Nasir", email: "nasir@mail.com", role: "teacher" as const, joinedAt: "2026-02-14", status: "active" as const },
  { id: "s11", name: "Imran Ali", email: "imran@mail.com", role: "student" as const, joinedAt: "2026-02-13", status: "inactive" as const },
  { id: "s12", name: "Priya Sen", email: "priya@mail.com", role: "student" as const, joinedAt: "2026-02-12", status: "active" as const },
];
