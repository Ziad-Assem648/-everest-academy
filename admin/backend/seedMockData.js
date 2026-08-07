import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const now = new Date().toISOString().replace("T", " ").split(".")[0];

export function getSeedUsers() {
  const pw = bcrypt.hashSync("password123", 10);
  const av = (email) => `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`;
  return [
    { id:"2000000001", name:"Ahmed Hassan", email:"ahmed@test.com", role:"student", type:"student", rank:"Star", em:5000, status:"active", ref:null, ds:3, ts:3, avatar:av("ahmed@test.com") },
    { id:"2000000002", name:"Sara Mohamed", email:"sara@test.com", role:"student", type:"student", rank:"Star", em:3000, status:"active", ref:"2000000001", ds:2, ts:2, avatar:av("sara@test.com") },
    { id:"2000000003", name:"Omar Ali", email:"omar@test.com", role:"student", type:"student", rank:"Executive", em:7500, status:"active", ref:"2000000001", ds:5, ts:5, avatar:av("omar@test.com") },
    { id:"2000000004", name:"Fatima Youssef", email:"fatima@test.com", role:"registration", type:"registration", rank:"", em:0, status:"active", ref:"2000000001", avatar:av("fatima@test.com") },
    { id:"2000000005", name:"Khaled Nasser", email:"khaled@test.com", role:"student", type:"student", rank:"Star", em:2000, status:"active", ref:"2000000002", ds:2, ts:2, avatar:av("khaled@test.com") },
    { id:"2000000006", name:"Nour Ibrahim", email:"nour@test.com", role:"registration", type:"registration", rank:"", em:500, status:"active", ref:"2000000002", avatar:av("nour@test.com") },
    { id:"2000000007", name:"Youssef Karim", email:"youssef@test.com", role:"student", type:"student", rank:"Executive Star", em:12000, status:"active", ref:"2000000003", ds:10, ts:10, avatar:av("youssef@test.com") },
    { id:"2000000008", name:"Layla Ahmad", email:"layla@test.com", role:"student", type:"student", rank:"Team Leader", em:20000, status:"active", ref:"2000000003", ds:20, ts:20, avatar:av("layla@test.com") },
    { id:"2000000009", name:"Mohamed Sami", email:"mohamed@test.com", role:"registration", type:"registration", rank:"", em:1000, status:"active", ref:"2000000003", avatar:av("mohamed@test.com") },
    { id:"2000000010", name:"Hana Mahmoud", email:"hana@test.com", role:"student", type:"student", rank:"", em:0, status:"pending", ref:"2000000005", avatar:av("hana@test.com") },
    { id:"2000000011", name:"Tarek Saleh", email:"tarek@test.com", role:"registration", type:"registration", rank:"", em:0, status:"pending", ref:"2000000007", avatar:av("tarek@test.com") },
    { id:"2000000012", name:"Reem Adel", email:"reem@test.com", role:"student", type:"student", rank:"", em:0, status:"rejected", ref:"2000000003", avatar:av("reem@test.com") },
    { id:"2000000013", name:"Amr Farouk", email:"amr@test.com", role:"student", type:"student", rank:"Senior Leader", em:35000, status:"active", ref:"2000000007", ds:40, ts:40, avatar:av("amr@test.com") },
    { id:"2000000014", name:"Dina Hosny", email:"dina@test.com", role:"student", type:"student", rank:"Executive Star", em:8000, status:"active", ref:"2000000008", ds:10, ts:10, avatar:av("dina@test.com") },
    { id:"2000000015", name:"Hamza Mostafa", email:"hamza@test.com", role:"registration", type:"registration", rank:"", em:2000, status:"active", ref:"2000000008", avatar:av("hamza@test.com") },
    { id:"2000000016", name:"Walid Rageh", email:"walid@test.com", role:"student", type:"student", rank:"", em:500, status:"active", blocked:1, ref:"2000000001", avatar:av("walid@test.com") },
    { id:"2000000017", name:"Mona Fawzy", email:"mona@test.com", role:"student", type:"student", rank:"Executive", em:6000, status:"active", ref:"2000000005", ds:5, ts:5, avatar:av("mona@test.com") },
    { id:"2000000018", name:"Zain Hossam", email:"zain@test.com", role:"student", type:"student", rank:"", em:1500, status:"active", ref:"2000000005", avatar:av("zain@test.com") },
  ];
}

export function getSeedCourses() {
  return [
    { id:"course-001", title:"MLM Mastery: Build Your Network", title_ar:"إتقان التسويق الشبكي", description:"Complete course on MLM strategies", description_ar:"دورة شاملة في MLM", category:"Business", category_ar:"أعمال", difficulty:"intermediate", price:500, price_egp:500, is_free:0, status:"published" },
    { id:"course-002", title:"Digital Marketing Fundamentals", title_ar:"أساسيات التسويق الرقمي", description:"Master digital marketing essentials", description_ar:"أتقن أساسيات التسويق الرقمي", category:"Marketing", category_ar:"تسويق", difficulty:"beginner", price:300, price_egp:300, is_free:0, status:"published" },
    { id:"course-003", title:"Leadership & Communication", title_ar:"القيادة والتواصل", description:"Develop leadership skills", description_ar:"طوّر مهارات القيادة", category:"Soft Skills", category_ar:"مهارات شخصية", difficulty:"beginner", price:0, price_egp:0, is_free:1, status:"published" },
  ];
}

export function getSeedTopics() {
  return [
    { id:"topic-001", cid:"course-001", title:"Introduction to MLM", title_ar:"مقدمة في التسويق الشبكي", summary:"Learn the basics", summary_ar:"تعلم الأساسيات", sort_order:0 },
    { id:"topic-002", cid:"course-001", title:"Building Your Team", title_ar:"بناء فريقك", summary:"How to recruit", summary_ar:"كيفية التجنيد", sort_order:1 },
    { id:"topic-003", cid:"course-002", title:"Social Media Marketing", title_ar:"تسويق وسائل التواصل", summary:"Social media strategies", summary_ar:"استراتيجيات التواصل", sort_order:0 },
    { id:"topic-004", cid:"course-002", title:"SEO Basics", title_ar:"أساسيات SEO", summary:"Search engine optimization", summary_ar:"تحسين محركات البحث", sort_order:1 },
    { id:"topic-005", cid:"course-003", title:"Communication Skills", title_ar:"مهارات التواصل", summary:"Effective communication", summary_ar:"التواصل الفعال", sort_order:0 },
  ];
}

export function getSeedLessons() {
  return [
    { id:"les-001", tid:"topic-001", title:"What is MLM?", title_ar:"ما هو التسويق الشبكي؟", content:"MLM definition", content_ar:"تعريف MLM", duration:30, is_free:1, video_url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { id:"les-002", tid:"topic-001", title:"History of MLM", title_ar:"تاريخ التسويق الشبكي", content:"MLM history", content_ar:"تاريخ MLM", duration:45, is_free:0, video_url:null },
    { id:"les-003", tid:"topic-001", title:"Types of MLM", title_ar:"أنواع التسويق الشبكي", content:"Types", content_ar:"الأنواع", duration:40, is_free:0, video_url:null },
    { id:"les-004", tid:"topic-002", title:"Recruitment Strategies", title_ar:"استراتيجيات التجنيد", content:"Recruiting", content_ar:"التجنيد", duration:50, is_free:0, video_url:null },
    { id:"les-005", tid:"topic-002", title:"Team Motivation", title_ar:"تحفيز الفريق", content:"Motivation", content_ar:"التحفيز", duration:35, is_free:1, video_url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { id:"les-006", tid:"topic-003", title:"Facebook Marketing", title_ar:"تسويق فيسبوك", content:"FB marketing", content_ar:"تسويق فيسبوك", duration:60, is_free:1, video_url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { id:"les-007", tid:"topic-003", title:"Instagram Growth", title_ar:"نمو إنستغرام", content:"IG growth", content_ar:"نمو إنستغرام", duration:45, is_free:0, video_url:null },
    { id:"les-008", tid:"topic-004", title:"What is SEO?", title_ar:"ما هو SEO؟", content:"SEO intro", content_ar:"مقدمة SEO", duration:55, is_free:0, video_url:null },
    { id:"les-009", tid:"topic-004", title:"Keyword Research", title_ar:"بحث الكلمات المفتاحية", content:"Keywords", content_ar:"الكلمات المفتاحية", duration:40, is_free:0, video_url:null },
    { id:"les-010", tid:"topic-005", title:"Active Listening", title_ar:"الاستماع الفعال", content:"Listening", content_ar:"الاستماع", duration:30, is_free:1, video_url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { id:"les-011", tid:"topic-005", title:"Public Speaking", title_ar:"التحدث أمام الجمهور", content:"Speaking", content_ar:"التحدث", duration:45, is_free:1, video_url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  ];
}

export function getSeedQuizzes() {
  return [
    { id:"quiz-001", topic_id:"topic-001", course_id:"course-001", type:"topic", title:"MLM Basics Quiz", questions:JSON.stringify([{type:"mcq",question:"What does MLM stand for?",question_ar:"ماذا يعني MLM؟",options:["Multi-Level Marketing","Money Loss Method","My Lovely Mother","Marketing Lead Machine"],answer:0},{type:"tf",question:"MLM is a pyramid scheme",question_ar:"التسويق الشبكي مخطط هرمي",answer:false},{type:"mcq",question:"Which is a benefit of MLM?",question_ar:"ما فائدة MLM؟",options:["No work","Residual income","Guaranteed wealth","No skills needed"],answer:1}]), total_marks:3, pass_mark:50 },
    { id:"quiz-002", topic_id:"topic-002", course_id:"course-001", type:"topic", title:"Team Building Quiz", questions:JSON.stringify([{type:"mcq",question:"First step in team building?",question_ar:"الخطوة الأولى في بناء الفريق؟",options:["Recruiting","Training","Planning","Selling"],answer:2},{type:"tf",question:"Motivation is key to success",question_ar:"التحفيز مفتاح النجاح",answer:true}]), total_marks:2, pass_mark:50 },
    { id:"quiz-003", topic_id:"topic-003", course_id:"course-002", type:"topic", title:"Social Media Quiz", questions:JSON.stringify([{type:"mcq",question:"Which platform has most users?",question_ar:"أي منصة أكثر مستخدمين؟",options:["Instagram","Twitter","Facebook","LinkedIn"],answer:2},{type:"tf",question:"Content quality matters",question_ar:"جودة المحتوى مهمة",answer:true}]), total_marks:2, pass_mark:50 },
    { id:"quiz-004", topic_id:"topic-004", course_id:"course-002", type:"topic", title:"SEO Quiz", questions:JSON.stringify([{type:"mcq",question:"What does SEO stand for?",question_ar:"ماذا يعني SEO؟",options:["Search Engine Optimization","Social Engine Online","Simple Easy Operation","System Error Output"],answer:0}]), total_marks:1, pass_mark:50 },
    { id:"quiz-005", topic_id:"topic-005", course_id:"course-003", type:"topic", title:"Communication Quiz", questions:JSON.stringify([{type:"mcq",question:"Active listening involves:",question_ar:"يتضمن الاستماع الفعال:",options:["Interrupting","Full attention","Phone checking","Multitasking"],answer:1},{type:"tf",question:"Body language is communication",question_ar:"لغة الجسد جزء من التواصل",answer:true}]), total_marks:2, pass_mark:50 },
    { id:"qf-001", topic_id:null, course_id:"course-001", type:"final", title:"MLM Mastery Final", questions:JSON.stringify([{type:"mcq",question:"Most important MLM skill?",question_ar:"أهم مهارة في MLM؟",options:["Selling","Leadership","Recruiting","All above"],answer:3},{type:"tf",question:"MLM requires relationships",question_ar:"يتطلب MLM بناء علاقات",answer:true},{type:"mcq",question:"Level 1 commission depth?",question_ar:"عمولة المستوى الأول؟",options:["1 level","2 levels","3 levels","5 levels"],answer:0},{type:"mcq",question:"Residual income means?",question_ar:"الدخل المتكرر يعني؟",options:["One-time","Ongoing from past work","Salary","Bonus only"],answer:1}]), total_marks:4, pass_mark:50 },
    { id:"qf-002", topic_id:null, course_id:"course-002", type:"final", title:"Digital Marketing Final", questions:JSON.stringify([{type:"mcq",question:"NOT a digital channel?",question_ar:"ليست قناة رقمية؟",options:["Email","Social Media","Television","SEO"],answer:2},{type:"tf",question:"Digital marketing is free",question_ar:"التسويق الرقمي مجاني",answer:false}]), total_marks:2, pass_mark:50 },
    { id:"qf-003", topic_id:null, course_id:"course-003", type:"final", title:"Leadership Final", questions:JSON.stringify([{type:"mcq",question:"A good leader:",question_ar:"القائد الجيد:",options:["Gives orders","Listens and guides","Works alone","Ignores feedback"],answer:1},{type:"tf",question:"Leadership cannot be learned",question_ar:"القيادة لا يمكن تعلمها",answer:false}]), total_marks:2, pass_mark:50 },
  ];
}

export function getSeedEnrollments() {
  return [
    ["2000000001","course-001","approved","admin",75],
    ["2000000001","course-002","approved","admin",40],
    ["2000000001","course-003","approved","admin",100],
    ["2000000002","course-001","approved","admin",50],
    ["2000000002","course-003","approved","admin",100],
    ["2000000003","course-001","approved","admin",90],
    ["2000000003","course-002","approved","emoney",20],
    ["2000000003","course-003","approved","admin",100],
    ["2000000005","course-001","approved","admin",60],
    ["2000000005","course-003","approved","admin",30],
    ["2000000007","course-001","approved","admin",100],
    ["2000000007","course-002","approved","admin",80],
    ["2000000008","course-001","approved","admin",95],
    ["2000000013","course-001","approved","admin",100],
    ["2000000013","course-002","approved","admin",100],
    ["2000000013","course-003","approved","admin",100],
    ["2000000014","course-001","approved","admin",45],
    ["2000000017","course-003","approved","emoney",65],
    ["2000000004","course-003","approved","admin",20],
    ["2000000009","course-003","approved","admin",10],
    ["2000000018","course-002","pending","emoney",0],
  ];
}

export function getSeedQuizAttempts() {
  return [
    ["quiz-001","2000000001",3,3,3,0,"pass"],
    ["quiz-001","2000000002",3,2,2,1,"pass"],
    ["quiz-001","2000000003",3,3,3,0,"pass"],
    ["quiz-001","2000000005",3,1,1,2,"fail"],
    ["quiz-001","2000000005",3,2,2,1,"pass"],
    ["quiz-002","2000000003",2,2,2,0,"pass"],
    ["quiz-003","2000000001",2,1,1,1,"pass"],
    ["quiz-005","2000000002",2,2,2,0,"pass"],
    ["qf-001","2000000003",4,4,4,0,"pass"],
    ["qf-001","2000000007",4,3,3,1,"pass"],
    ["qf-003","2000000002",2,2,2,0,"pass"],
  ];
}

export function getSeedCommissions() {
  return [
    ["2000000002","2000000001",1,1000],
    ["2000000003","2000000001",1,1000],
    ["2000000005","2000000002",1,1000],
    ["2000000007","2000000003",1,1000],
    ["2000000008","2000000003",1,1000],
  ];
}

export function getSeedFeedbacks() {
  return [
    ["2000000001","Great platform! The MLM course is very informative.",5],
    ["2000000002","I love the community here. Very supportive.",4],
    ["2000000003","Excellent content and well-structured courses.",5],
    ["2000000007","The leadership course changed my perspective.",5],
    ["2000000008","Very practical and applicable skills.",4],
    ["2000000005","Good platform, could use more courses.",4],
    ["2000000013","Best MLM platform in Egypt!",5],
    ["2000000017","The communication course is a must-take.",5],
  ];
}

export function getSeedNotifications() {
  return [
    ["2000000001","Welcome!","Welcome to Everest Academy","info"],
    ["2000000001","Commission Earned","You earned 1000 E-Money from Sara","commission"],
    ["2000000002","Welcome!","Welcome to Everest Academy","info"],
    ["2000000002","Commission Earned","You earned 1000 E-Money from Khaled","commission"],
    ["2000000003","Welcome!","Welcome to Everest Academy","info"],
    ["2000000003","Rank Achieved","Congratulations! Executive rank","success"],
    ["2000000003","Commission Earned","20000 E-Money from referrals","commission"],
    ["2000000007","Rank Achieved","Executive Star rank achieved","success"],
    ["2000000008","Rank Achieved","Team Leader rank achieved","success"],
    ["2000000013","Rank Achieved","Senior Leader rank achieved","success"],
  ];
}

export function getSeedWeeklyHistory() {
  return [
    ["2000000001","2026-07-06","2026-07-12","","Star",3,3,0,3,1,3,2,1,0,0,0,"no_team","no_change","Team too small"],
    ["2000000003","2026-07-06","2026-07-12","","Executive",5,5,0,5,2,5,2,1,0,0,1500,"eligible","promoted",null],
    ["2000000001","2026-07-13","2026-07-19","Star","Star",3,3,0,3,1,3,2,1,0,0,0,"no_team","no_change","Team too small"],
    ["2000000003","2026-07-13","2026-07-19","Executive","Executive",5,5,0,5,2,5,2,1,0,0,1500,"eligible","no_change",null],
    ["2000000007","2026-07-13","2026-07-19","","Executive Star",10,10,0,10,3,10,3,0,0,0,3000,"eligible","no_change",null],
  ];
}

export function getSeedLeaders() {
  const av = (email) => `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`;
  return [
    ["Amr Farouk","Senior Leader","\uD83C\uDFC6",1,av("amr@test.com")],
    ["Youssef Karim","Executive Star","\uD83E\uDD48",2,av("youssef@test.com")],
    ["Omar Ali","Executive","\uD83E\uDD49",3,av("omar@test.com")],
    ["Dina Hosny","Executive Star","\u2B50",4,av("dina@test.com")],
    ["Ahmed Hassan","Star","\uD83C\uDF1F",5,av("ahmed@test.com")],
  ];
}

export function getSeedCourseReviews() {
  return [
    ["course-001","2000000001",5,"Amazing MLM course!"],
    ["course-001","2000000003",5,"Very comprehensive."],
    ["course-001","2000000007",4,"Great, could use more examples."],
    ["course-001","2000000013",5,"Best MLM course out there."],
    ["course-002","2000000003",4,"Good overview of digital marketing."],
    ["course-003","2000000002",5,"Life-changing skills!"],
    ["course-003","2000000001",4,"Very practical tips."],
  ];
}

export function getSeedSettings() {
  return [
    ["customer_service_whatsapp", "+201234567890"],
    ["customer_service_email", "support@everestacademy.com"],
    ["settlement_enabled", "true"],
    ["settlement_day", "5"],
    ["settlement_hour", "0"],
    ["settlement_minute", "0"],
    ["settlement_timezone", "Africa/Cairo"],
    ["settlement_min_direct_sales", "2"],
  ];
}
