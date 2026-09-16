/**
 * Example figures for the dashboard, shaped exactly like the real endpoints.
 *
 * Reached with `?demo=1`. It exists so the layout, the charts and the action
 * queue can be seen populated before the backend is running — an empty panel
 * shows nothing about what the panel is for.
 *
 * Everything here is invented. The page says so on screen the whole time it is
 * in use, so these numbers can never be mistaken for the centre's own.
 */

const MONTHS = [
  { month: "2025-10", bookings: 18, completed: 15, averageBand: 5.4, revenue: 9000000 },
  { month: "2025-11", bookings: 22, completed: 19, averageBand: 5.6, revenue: 11000000 },
  { month: "2025-12", bookings: 14, completed: 12, averageBand: 5.5, revenue: 7000000 },
  { month: "2026-01", bookings: 26, completed: 21, averageBand: 5.8, revenue: 13000000 },
  { month: "2026-02", bookings: 24, completed: 20, averageBand: null, revenue: 12000000 },
  { month: "2026-03", bookings: 31, completed: 27, averageBand: 5.9, revenue: 15500000 },
  { month: "2026-04", bookings: 29, completed: 24, averageBand: 6.0, revenue: 14500000 },
  { month: "2026-05", bookings: 35, completed: 30, averageBand: 6.1, revenue: 17500000 },
  { month: "2026-06", bookings: 27, completed: 23, averageBand: 5.9, revenue: 13500000 },
  { month: "2026-07", bookings: 19, completed: 16, averageBand: null, revenue: 9500000 },
  { month: "2026-08", bookings: 33, completed: 28, averageBand: 6.2, revenue: 16500000 },
  { month: "2026-09", bookings: 31, completed: 19, averageBand: 5.7, revenue: 15500000 },
];

/** 0.0 → 9.0 in half steps, as the real endpoint always sends it. */
const DISTRIBUTION = [
  0, 0, 0, 0, 0, 0, 0, 0, 2, 5, 11, 18, 24, 21, 13, 6, 2, 1, 0,
].map((count, index) => ({ band: index * 0.5, count }));

const student = (examId, userId, studentName, extra = {}) => ({
  examId,
  userId,
  studentName,
  testDate: "2026-09-14",
  testTime: "morning",
  ...extra,
});

export const DEMO_ATTENTION = {
  failedExams: {
    count: 2,
    items: [
      student(1041, 141, "Bobur Aliyev", { module: "listening" }),
      student(1043, 143, "Nilufar Rasulova", { module: "listening", testTime: "afternoon" }),
    ],
  },
  stuckExams: {
    count: 1,
    items: [student(1052, 152, "Jasur Tursunov", { module: "reading" })],
  },
  writingUnchecked: {
    count: 14,
    items: [
      student(1018, 118, "Aziz Karimov", { module: "writing" }),
      student(1019, 119, "Malika Yusupova", { module: "writing" }),
      student(1021, 121, "Sardor Ergashev", { module: "writing", testTime: "afternoon" }),
      student(1024, 124, "Dilnoza Qodirova", { module: "writing", testTime: "afternoon" }),
      student(1027, 127, "Otabek Sattorov", { module: "writing", testTime: "evening" }),
    ],
  },
  speakingUnscored: {
    count: 12,
    items: [
      student(1031, 131, "Kamola Tosheva"),
      student(1032, 132, "Shohruh Nazarov"),
      student(1035, 135, "Zarina Ibragimova", { testTime: "afternoon" }),
    ],
  },
  paymentExpired: {
    count: 3,
    items: [
      { bookingId: 611, studentName: "Ulug'bek Rahimov", testDate: "2026-09-14" },
      { bookingId: 612, studentName: "Feruza Xolmatova", testDate: "2026-09-14" },
    ],
  },
  paymentPending: {
    count: 6,
    items: [
      { bookingId: 620, studentName: "Doston Mirzayev", testDate: "2026-09-14" },
      { bookingId: 621, studentName: "Sevara Normatova", testDate: "2026-09-14" },
    ],
  },
};

export const DEMO_SCORES = {
  from: "2026-08-15",
  to: "2026-09-14",
  examCount: 103,
  average: { overall: 5.7, listening: 5.6, reading: 5.9, writing: 5.3, speaking: 6.0 },
  distribution: DISTRIBUTION,
  byBranch: [
    { branchId: 1, branchName: "Chilonzor", average: 5.9, examCount: 48 },
    { branchId: 2, branchName: "Yunusobod", average: 5.6, examCount: 35 },
    { branchId: 3, branchName: "Sergeli", average: 5.4, examCount: 20 },
  ],
};

export const DEMO_TREND = {
  months: MONTHS,
  currentPeriod: { bookings: 309, completed: 254, averageBand: 5.8, revenue: 154500000 },
  previousPeriod: { bookings: 231, completed: 190, averageBand: 5.5, revenue: 115000000 },
};

export const DEMO_CAPACITY = {
  days: [8, 12, 24, 30, 18, 6, 0].map((booked, index) => {
    const date = new Date(2026, 8, 15 + index).toISOString().slice(0, 10);
    return {
      date,
      shifts: [
        { testTime: "morning", capacity: 30, booked, free: 30 - booked },
        {
          testTime: "evening",
          capacity: 30,
          booked: Math.max(0, booked - 6),
          free: 30 - Math.max(0, booked - 6),
        },
      ],
    };
  }),
};

export const DEMO_ARCHIVE = {
  totalUsers: 412,
  everester: 168,
  nonEverester: 244,
  onlineRegister: 121,
  totalReading: 24,
  totalWriting: 18,
  totalListening: 21,
  previous: {
    totalUsers: 366,
    everester: 151,
    nonEverester: 215,
    onlineRegister: 98,
    totalReading: 22,
    totalWriting: 18,
    totalListening: 19,
  },
};

export const DEMO_BRANCH_BOOKINGS = [
  ["Chilonzor", [12, 9, 15, 18, 14, 11]],
  ["Yunusobod", [8, 11, 9, 13, 10, 7]],
  ["Sergeli", [4, 6, 5, 8, 6, 5]],
].flatMap(([branchName, counts], branchIndex) =>
  counts.map((bookingCount, monthIndex) => ({
    branchId: branchIndex + 1,
    branchName,
    month: `2026-0${monthIndex + 4}-01`,
    bookingCount,
  }))
);
