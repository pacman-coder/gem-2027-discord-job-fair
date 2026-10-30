// ─────────────────────────────────────────────────────────────────────────────
//  GEM Job Fair 2026 — the job listings and their interviews.
//
//  Edit this file to change a job. Fields:
//    id          stable slug; also decides the Render env var name for
//                the Discord role (e.g. "pe-teacher" → ROLE_PE_TEACHER)
//    slots       how many people can hold the job at once
//    priority    "high", "competitive" or null — shown as a sticker
//    seedHolders names shown ONLY in demo mode or when a job has no Discord
//                role ID yet. Once the role ID is set, the site reads the
//                holders straight from Discord.
//    passScore   correct answers needed to pass the interview
//    interview   questions; `answer` is the index of the correct option.
//                Answers never leave the server.
// ─────────────────────────────────────────────────────────────────────────────

export const JOBS = [
  {
    id: "birthday-celebrator",
    title: "Birthday Celebrator",
    posted: "10/23/26",
    slots: 1,
    priority: "high",
    bullets: [
      "Keep a record of every member's birthday",
      "Organize celebrations with cake and a card (cost shared by the group or covered by one person)",
      "Make each member feel loved on their day, in the way they like to be loved",
      "Rally members to join in; coordinate with the Snacks Recruiter and CG leaders",
    ],
    skills: ["Planning", "Communication", "Sensitivity", "Love languages"],
    seedHolders: [],
    passScore: 2,
    interview: [
      {
        q: "A birthday is coming up this week. What's always on the menu?",
        options: ["A 45-slide presentation on aging gracefully", "Cake and a card", "A surprise skydiving trip"],
        answer: 1,
      },
      {
        q: "Who pays for the cake?",
        options: ["The birthday person, obviously", "Whoever loses rock-paper-scissors", "The group can split it, or one person can cover it"],
        answer: 2,
      },
      {
        q: "This member's love language is quality time, not gifts. You…",
        options: ["Plan time together with the people they love", "Buy a bigger gift", "Send a thumbs-up emoji"],
        answer: 0,
      },
    ],
  },
  {
    id: "calendar-painter",
    title: "Calendar Painter",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Design an eye-catching calendar graphic for each month's CG events",
      "Keep every date accurate and easy to read",
    ],
    skills: ["Creativity", "Attention to detail", "Canva (or another graphics editor)", "Deadline-oriented"],
    seedHolders: ["Priscilla Woo"],
    passScore: 2,
    interview: [
      {
        q: "What do you deliver every month?",
        options: ["A playlist of worship bangers", "A sourdough starter", "A calendar graphic of that month's CG events"],
        answer: 2,
      },
      {
        q: "Your calendar looks gorgeous, but one date is wrong. Ship it?",
        options: ["No. Fix it first; accuracy comes before beauty", "Yes, nobody reads dates", "Yes, but add more glitter"],
        answer: 0,
      },
      {
        q: "Your tool of choice?",
        options: ["Crayons on a napkin", "Canva or another graphics editor", "Smoke signals"],
        answer: 1,
      },
    ],
  },
  {
    id: "prayer-starter",
    envAliases: ["ROLE_PRAYER_KEEPER"], // last year's variable name still works
    title: "Prayer Starter",
    posted: "4/10/26",
    slots: 2,
    priority: "high",
    bullets: [
      "Host bi-weekly prayer meetings on Discord",
      "Encourage members to join in",
      "Record each meeting's prayer requests and topics and share them in Discord",
      "Suggest prayer topics",
    ],
    skills: ["Listening", "Time management", "Writing"],
    seedHolders: [],
    passScore: 2,
    interview: [
      {
        q: "How often do the prayer meetings happen?",
        options: ["Once a decade", "Every two weeks", "Only during leap years"],
        answer: 1,
      },
      {
        q: "Where are they hosted?",
        options: ["On Discord", "By carrier pigeon", "In a group fax"],
        answer: 0,
      },
      {
        q: "The meeting just wrapped up. Now you…",
        options: ["Forget everything immediately", "Post the requests on a billboard", "Write down the requests and topics and share them in Discord"],
        answer: 2,
      },
    ],
  },
  {
    id: "snacks-recruiter",
    title: "Snacks Recruiter",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Recruit volunteers to bring snacks each week; coordinate with CG leaders and the Birthday Celebrator",
      "Rotate people fairly, keeping budgets and schedules in mind",
      "Keep snacks delicious, healthy and budget-friendly (volunteers cover the cost)",
      "Poll members and volunteers for snack feedback",
    ],
    skills: ["Nurturing motherly instincts", "Planning ahead", "Communication"],
    seedHolders: ["Sam Kwak"],
    passScore: 2,
    interview: [
      {
        q: "Who pays for this week's snacks?",
        options: ["The volunteer bringing them", "The CG leader's secret vault", "The vending machine, as an act of grace"],
        answer: 0,
      },
      {
        q: "A member is tight on money this month. You…",
        options: ["Assign them the charcuterie board", "Rotate them to a later week and plan around it", "Ask them to bring two of everything"],
        answer: 1,
      },
      {
        q: "How do you know the snacks are a hit?",
        options: ["Count the crumbs", "Assume yes", "Poll members for feedback"],
        answer: 2,
      },
    ],
  },
  {
    id: "potluck-clover",
    title: "Potluck Clover",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Spread the good news of potluck",
      "Share potluck details and make sign-up sheets",
      "Keep the spread delicious, healthy and budget-friendly (volunteers cover the cost)",
      "Poll members for potluck feedback",
    ],
    skills: ["Culinary creativity", "Communication"],
    seedHolders: ["Dave Park"],
    passScore: 2,
    interview: [
      {
        q: "First step before any potluck?",
        options: ["Share the details and a sign-up sheet", "Hope it works out", "Hide the forks"],
        answer: 0,
      },
      {
        q: "Twelve people signed up to bring chips. You…",
        options: ["Embrace the chip life", "Cancel the potluck", "Rebalance the sign-ups so we get a real spread"],
        answer: 2,
      },
      {
        q: "Who covers the cost of each dish?",
        options: ["The person who brings it", "You, personally, forever", "Nobody; food appears"],
        answer: 0,
      },
    ],
  },
  {
    id: "photographer",
    title: "Photographer",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Capture the key moments and the everyday ones",
      "Manage the CG photo album",
      "Keep an album of photos to print, and print them as needed for the CG board or members",
    ],
    skills: [],
    seedHolders: ["Gloria Lee"],
    passScore: 2,
    interview: [
      {
        q: "Which moments are worth a photo?",
        options: ["Only perfectly posed ones", "The big moments and the everyday ones", "Only the food"],
        answer: 1,
      },
      {
        q: "Where do the photos live?",
        options: ["Lost in your camera roll", "On a floppy disk", "In the CG photo album"],
        answer: 2,
      },
      {
        q: "The CG board needs fresh pictures. You…",
        options: ["Print some from the album and put them up", "Draw them from memory", "Tell everyone to imagine it"],
        answer: 0,
      },
    ],
  },
  {
    id: "events-coordinator",
    title: "Events Coordinator",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Work with CG leaders to promote yearly events (Secret Church, summer retreat, Christmas party and more)",
      "Help plan and run yearly events alongside CG leaders",
      "Keep records of each event and lessons learned for next time",
    ],
    skills: ["Visionary", "Event coordination", "Finances"],
    seedHolders: ["Priscilla Woo"],
    passScore: 2,
    interview: [
      {
        q: "Which of these is a yearly event you'd help run?",
        options: ["A Tuesday nap", "Summer retreat", "The annual sock-sorting gala"],
        answer: 1,
      },
      {
        q: "Who do you plan events with?",
        options: ["CG leaders", "Nobody; you fly solo", "A Magic 8 Ball"],
        answer: 0,
      },
      {
        q: "The Christmas party just ended. Next you…",
        options: ["Delete all evidence", "Start planning next Christmas at 11:58 pm", "Write down what worked and what to improve"],
        answer: 2,
      },
    ],
  },
  {
    id: "tea-sommelier",
    title: "Tea Sommelier",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Arrange monthly tea-time groups and share the details",
      "Plan icebreakers and activities that help members connect",
      "Poll members for tea-time feedback",
    ],
    skills: ["Interpersonal skills", "Writing"],
    seedHolders: ["Jooeun Kang"],
    passScore: 2,
    interview: [
      {
        q: "How often does tea time happen?",
        options: ["Hourly", "Monthly", "Only when the kettle sings"],
        answer: 1,
      },
      {
        q: "The table has gone quiet and a little awkward. You…",
        options: ["Sip louder", "Leave quietly", "Break out an icebreaker"],
        answer: 2,
      },
      {
        q: "What's tea time really for?",
        options: ["Helping members connect", "Ranking teas in a bracket", "Finishing the cookies"],
        answer: 0,
      },
    ],
  },
  {
    id: "ambassador",
    title: "Ambassador",
    posted: "4/10/26",
    slots: 1,
    priority: null,
    bullets: [
      "Arrange pastoral care and request pastor visits",
      "Keep a record of pastors' prayer requests and major events",
      "Work with CG leaders so pastors are well cared for whenever they visit",
    ],
    skills: ["Interpersonal skills", "Hospitality", "Communication"],
    seedHolders: ["Gloria Lee"],
    passScore: 2,
    interview: [
      {
        q: "A pastor is visiting CG this week. You coordinate with…",
        options: ["CG leaders", "The pizza guy only", "Nobody; it'll be fine"],
        answer: 0,
      },
      {
        q: "What do you keep a record of?",
        options: ["Everyone's shoe sizes", "Pastors' prayer requests and major events", "Parking tickets"],
        answer: 1,
      },
      {
        q: "Hospitality means…",
        options: ["Handing them a map to the snacks", "Pointing at a chair", "Making sure the pastor feels welcomed and cared for"],
        answer: 2,
      },
    ],
  },
  {
    id: "field-surveyor",
    title: "Field Surveyor",
    posted: "4/10/26",
    slots: 1,
    priority: "high",
    bullets: [
      "Research the mission field and share findings with CG",
      "Work with CG leaders to grow mission-field literacy through CG activities and sharing, especially during weekly mission time",
    ],
    skills: ["Multicultural", "Reading", "Communication", "Campaigning"],
    seedHolders: [],
    passScore: 2,
    interview: [
      {
        q: "What do you research?",
        options: ["The best boba within 5 miles", "The mission field", "Fantasy football stats"],
        answer: 1,
      },
      {
        q: "When's the best time to share what you found?",
        options: ["Weekly mission time (and beyond)", "Never; keep it secret", "At 3 am in the group chat"],
        answer: 0,
      },
      {
        q: "You found a great story about the mission field. You…",
        options: ["Keep it to yourself", "Turn it into a 90-minute lecture", "Share it with CG and work with leaders on an activity"],
        answer: 2,
      },
    ],
  },
  {
    id: "director-of-boards",
    title: "Director of Boards",
    posted: "10/29/26",
    slots: 1,
    priority: "high",
    bullets: [
      "Set up the welcome board each week with the CG schedule and upcoming events",
      "Prepare ahead of time and check in with the CG leader",
      "Set up and put away the boards",
    ],
    skills: ["Timeliness", "Craftiness", "Attention to detail"],
    seedHolders: [],
    passScore: 2,
    interview: [
      {
        q: "How often does the welcome board go up?",
        options: ["Weekly", "Once a year", "Whenever the board feels ready"],
        answer: 0,
      },
      {
        q: "To get this week's info, you check in with…",
        options: ["Your horoscope", "The CG leader", "A fortune cookie"],
        answer: 1,
      },
      {
        q: "CG is over. The boards…",
        options: ["Stay up forever as modern art", "Are someone else's problem", "Get put away by you"],
        answer: 2,
      },
    ],
  },
  {
    id: "choirmaster",
    title: "Choir/Choirmaster",
    posted: "10/29/26",
    slots: 1,
    priority: "high",
    bullets: ["Lead worship songs at CG every week"],
    skills: ["Singing", "Guitar", "Piano"],
    seedHolders: [],
    passScore: 2,
    interview: [
      {
        q: "How often do you lead worship at CG?",
        options: ["Every week", "Only on Easter", "Only when someone requests Wonderwall"],
        answer: 0,
      },
      {
        q: "Which of these is a preferred skill for this role?",
        options: ["Juggling", "Guitar or piano", "Beatboxing"],
        answer: 1,
      },
      {
        q: "Worship songs are for…",
        options: ["Showing off your high notes", "Filling awkward silence", "Leading the group in praising God together"],
        answer: 2,
      },
    ],
  },
  {
    id: "pe-teacher",
    title: "PE Teacher",
    posted: "10/29/26",
    slots: 1,
    priority: null,
    bullets: [
      "Teach and promote physical fitness for the purpose of godliness",
      "Plan weekly stretches and warm-ups for CG",
      "Plan regular physical activities outside of CG",
    ],
    skills: ["Physical fitness knowledge", "Enthusiasm"],
    seedHolders: [],
    passScore: 2,
    interview: [
      {
        q: "What happens at the start of CG?",
        options: ["A 10-mile run", "A competitive nap", "Stretches and warm-ups you planned"],
        answer: 2,
      },
      {
        q: "Physical fitness, for the purpose of…",
        options: ["Godliness", "Flexing at the potluck", "Beating the Snacks Recruiter in arm wrestling"],
        answer: 0,
      },
      {
        q: "Outside of CG, you also plan…",
        options: ["Nothing; CG is enough cardio", "Regular physical activities for the group", "A gym membership pyramid scheme"],
        answer: 1,
      },
    ],
  },
  {
    id: "marketing-coordinator",
    title: "Marketing Coordinator",
    posted: "10/29/26",
    slots: 1,
    priority: "competitive",
    bullets: [
      "Create content with CG leaders that shares CG life with the church on social platforms",
      "Draft blog posts, social media updates and promotional materials",
      "A highly creative role that requires coordination with CG leaders",
    ],
    skills: ["Social media", "Strong written and verbal communication", "Creative problem-solving", "Self-starter"],
    seedHolders: [],
    passScore: 3, // competitive: a perfect interview is required
    interview: [
      {
        q: "Who is your audience?",
        options: ["The whole church, seeing what CG life looks like", "Only your followers", "Brands that might sponsor us"],
        answer: 0,
      },
      {
        q: "Before you post about CG, you…",
        options: ["Post first, ask later", "Coordinate with CG leaders", "Run a poll on whether to ask"],
        answer: 1,
      },
      {
        q: "Which of these is part of the job?",
        options: ["Buying followers", "Arguing in comment sections", "Drafting blog posts, social updates and promo materials"],
        answer: 2,
      },
    ],
  },
];

// Discord role ID env var for a job, e.g. "pe-teacher" → ROLE_PE_TEACHER
export const roleEnvName = (id) => "ROLE_" + id.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
