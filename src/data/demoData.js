export const DEMO_USER = {
  firstName: 'narayana', lastName: 'KNR',
  email: 'narayana@knrtech.in',
  degree: 'B.Tech Computer Science',
  college: 'Jntu A',
  year: '2024', cgpa: '8.7',
  skills: ['Python','JavaScript','React','Node.js','SQL','AWS','Docker','Git','MongoDB'],
  softSkills: ['Communication','Teamwork','Problem Solving'],
  exp: 'TCS | Software Intern | Jun–Aug 2024\n• Built REST APIs using Node.js & Express\n• Optimized SQL queries — 30% faster response\n• Deployed microservices on AWS EC2\n\nProject: E-Commerce App (React + Node + MongoDB)\n• Served 150+ active users; integrated Razorpay API',
  summary: 'Motivated B.Tech graduate with strong skills in Python, React and cloud. Built 3 full-stack projects deployed to production. Seeking software engineering roles to deliver impactful digital products.',
  achievements: '• AWS Certified Cloud Practitioner (2024)\n• Winner — HackFest National Hackathon 2023\n• Top 100 qualifier — TCS CodeVita Round 2'
}

export const JOBS = [
  {id:1,title:'Software Engineer — Frontend',co:'Swiggy',logo:'🍔',loc:'Bangalore',type:'Full-time',sal:'8–12 LPA',match:95,tags:['React','JavaScript','TypeScript','CSS'],posted:'2h ago',isNew:true,
   desc:"Join Swiggy's consumer experience team to build delightful interfaces used by 60M+ users. Work with React, TypeScript and modern tooling in a fast-paced Agile environment. Ownership from Day 1.",
   req:['2+ years React / strong fresher portfolio','TypeScript proficiency','Experience with REST APIs & state management','Strong communication skills']},
  {id:2,title:'Python Developer Intern',co:'Google',logo:'🔍',loc:'Hyderabad',type:'Internship',sal:'₹55K/month',match:96,tags:['Python','Django','GCP','ML'],posted:'4h ago',isNew:true,
   desc:'6-month paid internship on Google Cloud infrastructure tools. Work alongside senior engineers on large-scale distributed systems. High chance of return offer.',
   req:['Strong Python & data structures','Django or Flask knowledge','Basic cloud concepts (GCP/AWS)','Final year / recently graduated']},
  {id:3,title:'Full Stack Developer',co:'Razorpay',logo:'💳',loc:'Bangalore (Remote)',type:'Full-time',sal:'10–16 LPA',match:88,tags:['Node.js','React','PostgreSQL','AWS'],posted:'1d ago',isNew:false,
   desc:'Build and scale payment infrastructure serving 8M+ businesses across India. Work on critical, high-throughput financial systems. Excellent stock options.',
   req:['3 yrs full-stack (Node + React)','Strong SQL & database design','Cloud infra (AWS/GCP)','Fintech or high-scale experience']},
  {id:4,title:'Data Analyst — Business',co:'Flipkart',logo:'🛒',loc:'Bangalore',type:'Full-time',sal:'6–9 LPA',match:82,tags:['SQL','Python','Tableau','Excel'],posted:'1d ago',isNew:false,
   desc:"Analyze supply-chain and customer-experience data for Flipkart's marketplace. Drive decisions that impact millions of transactions daily.",
   req:['Strong SQL (aggregates, joins, CTEs)','Python for data wrangling','Tableau or Power BI','Business acumen']},
  {id:5,title:'Backend Engineer Intern',co:'CRED',logo:'💎',loc:'Bangalore',type:'Internship',sal:'₹45K/month',match:84,tags:['Java','Spring Boot','Kafka','Redis'],posted:'3h ago',isNew:true,
   desc:"Work on CRED's credit scoring and rewards engine processing millions of high-value transactions per day. Mentorship from top-tier engineers.",
   req:['Strong Java fundamentals','Spring Boot / microservices','Knowledge of Kafka is a plus','Problem-solving mindset']},
  {id:6,title:'React Native Developer',co:'PhonePe',logo:'📱',loc:'Bangalore (Remote)',type:'Full-time',sal:'10–15 LPA',match:87,tags:['React Native','JavaScript','iOS','Android'],posted:'2d ago',isNew:false,
   desc:'Build PhonePe mobile app features for 500M+ users in India. Own features end-to-end — design, code, test, ship.',
   req:['2+ years React Native','Strong JavaScript / performance tuning','Native module experience a plus','App Store release process knowledge']},
  {id:7,title:'Machine Learning Intern',co:'Amazon',logo:'📦',loc:'Chennai',type:'Internship',sal:'₹60K/month',match:76,tags:['Python','TensorFlow','ML','AWS SageMaker'],posted:'2d ago',isNew:false,
   desc:'Intern with Alexa AI team on NLP model optimization. Work with world-class ML researchers. Potential for PPO.',
   req:['Strong ML/DL fundamentals','TensorFlow or PyTorch','Python proficiency','Research mindset']},
  {id:8,title:'Cloud Engineer Trainee',co:'TCS',logo:'🏢',loc:'Pan India',type:'Full-time',sal:'3.5–5 LPA',match:80,tags:['AWS','Azure','Linux','Python'],posted:'3d ago',isNew:false,
   desc:'Join TCS cloud practice. Extensive classroom + on-the-job training provided. Great launchpad for cloud career.',
   req:['Fresh graduates (2024/2025 batch)','Basic cloud awareness','AWS/Azure cert a plus','Any programming language']},
]

export const NOTIFS = [
  {ic:'💼',title:'New job match: Frontend Engineer at Swiggy',desc:'95% skill match in Bangalore. React + TypeScript. Posted 2 hours ago.',time:'2h ago',unr:true,clr:'var(--color-blu)'},
  {ic:'🔥',title:'5 new jobs match your profile today',desc:'Python Intern at Google, Full Stack at Razorpay, Backend Intern at CRED + 2 more.',time:'Today 8:00 AM',unr:true,clr:'var(--color-grn)'},
  {ic:'📄',title:'Resume tip: Add GitHub to boost score +12 pts',desc:'Recruiters are 3× more likely to shortlist profiles with a public GitHub.',time:'Yesterday',unr:true,clr:'var(--color-gold)'},
  {ic:'📊',title:'Your TCS application was viewed by a recruiter',desc:'Cloud Engineer Trainee — consider sending a follow-up message!',time:'2 days ago',unr:true,clr:'var(--color-prp)'},
  {ic:'🎯',title:'Interview tip: Master the STAR method',desc:'Behavioural questions appear in 90% of HR rounds. Practice Situation-Task-Action-Result.',time:'3 days ago',unr:true,clr:'var(--color-pink, #f778ba)'},
  {ic:'💡',title:'Trending skill: TypeScript rising 180% YoY',desc:'Adding TypeScript to your profile could improve your match score by 8 points.',time:'4 days ago',unr:false,clr:'var(--color-gold)'},
  {ic:'🚀',title:'Weekly career digest — Top 10 jobs for you',desc:'Your personalised weekly newsletter with top picks and career resources is ready.',time:'5 days ago',unr:false,clr:'var(--color-blu)'},
]

export const APPS_INIT = [
  {co:'Google',role:'Python Developer Intern',status:'Interview',date:'2025-03-01',sal:'₹55K/mo',notes:'Round 2 on Mar 15',logo:'🔍'},
  {co:'Swiggy',role:'Frontend Engineer',status:'In Review',date:'2025-03-03',sal:'8–12 LPA',notes:'Applied via LinkedIn',logo:'🍔'},
  {co:'Infosys',role:'Cloud Engineer',status:'Applied',date:'2025-03-05',sal:'3.5–5 LPA',notes:'',logo:'🏢'},
  {co:'Razorpay',role:'Full Stack Intern',status:'Applied',date:'2025-03-04',sal:'₹45K/mo',notes:'College senior referral',logo:'💳'},
  {co:'Amazon',role:'ML Intern',status:'Offer',date:'2025-02-20',sal:'₹60K/mo',notes:'🎉 Offer letter received!',logo:'📦'},
]

export const AI_RESPONSES = {
  resume:[
    "Great question! Here are my top resume tips for students:\n\n**1. Action verbs** — Start every bullet with *Developed*, *Built*, *Improved*, *Led*, *Deployed*.\n\n**2. Quantify everything** — Not 'improved performance' but 'improved query performance by 30% using index optimization'.\n\n**3. ATS keywords** — Mirror the exact words from the job description. If they say 'REST API', use that, not 'web services'.\n\n**4. One page max** — For freshers, keep it tight. Every line must earn its place.\n\n**5. GitHub link is gold** — Add it to your contact section. Even 2–3 good projects there make a huge difference.\n\nWant me to review your specific resume sections?",
  ],
  interview:[
    "Let me prep you for Python interviews!\n\n**What they ask:**\n\n*Core Python:*\n→ List vs Tuple vs Set vs Dict\n→ Generators and iterators\n→ Decorators and closures\n→ OOP: inheritance, polymorphism\n\n*DSA rounds:*\n→ Arrays, Strings (Two Pointers, Sliding Window)\n→ Hash Maps (most frequent problems)\n→ Recursion & Trees\n→ Dynamic Programming (basic)\n\n**Practice plan:**\n1. LeetCode Easy → 30 problems\n2. LeetCode Medium → 20 problems\n3. 2 mock interviews per week\n\nWant me to create a 4-week study plan?",
  ],
  skills:[
    "Top skills for data science in 2025 based on actual job postings:\n\n**Must-have foundation:**\n→ Python (Pandas, NumPy, Scikit-learn)\n→ SQL (window functions, aggregations, CTEs)\n→ Statistics & probability basics\n\n**Get noticed with:**\n→ Machine Learning (supervised + unsupervised)\n→ Data Visualization (Matplotlib, Seaborn, Tableau)\n→ Big Data basics (Spark, Databricks)\n→ Cloud (AWS SageMaker, GCP Vertex AI)\n\n**Trending in 2025:**\n→ LLM fine-tuning & prompt engineering\n→ MLflow / experiment tracking\n→ Feature engineering pipelines",
  ],
  salary:[
    "Salary negotiation script for freshers — here's exactly what to say:\n\n**When asked 'What are your salary expectations?':**\n\n*Say:* 'I've done research on Glassdoor and AmbitionBox, and for this role and skill set in [City], the market range is ₹X–Y LPA. Given my experience with [your key skill], I'd be looking at the higher end of that range.'\n\n**Key facts:**\n→ 65% of companies have flexibility on the initial offer\n→ The worst they can say is no — it won't rescind the offer\n→ Always negotiate in writing after verbal",
  ],
  coldEmail:[
    "Here's a cold email template with a 40%+ open rate:\n\n---\n**Subject:** Excited about [Company] — [Your Skill] Developer Background\n\nHi [First Name],\n\nI came across [specific thing about the company] and it really resonated with me.\n\nI'm a [B.Tech CSE] graduate with hands-on experience in [Python + React]. I recently [built X project] and I'm looking for opportunities in [role].\n\nWould you be open to a quick 15-minute chat?\n\nBest,\n[Your Name]\n[LinkedIn] | [GitHub]\n\n---\n\n**Why it works:**\n→ Specific — not a generic blast\n→ Short (under 120 words)\n→ Clear ask (15 minutes)\n→ Links to proof of work",
  ],
  default:[
    "That's a great question! Here's what I'd recommend based on current hiring trends:\n\n**For freshers in 2025, these 3 things matter most:**\n\n1. **Real projects over tutorials** — Deploy something. Even a simple CRUD app on Render or Vercel shows initiative.\n\n2. **Build in public** — Share your projects on LinkedIn. Even 'I built X this weekend' posts get recruiter attention.\n\n3. **Referrals > Job portals** — 40% of hires come from referrals. Reach out to seniors from your college on LinkedIn.\n\nWant a personalized roadmap based on your current skills?",
  ],
}

export function bgColor(logo) {
  const m = {'🔍':'#dbeafe','🍔':'#dcfce7','💳':'#ede9fe','📦':'#fef3c7','💎':'#fdf4ff','📱':'#f0fdf4','🛒':'#fff7ed','🏢':'#f8fafc'}
  return m[logo] || '#f1f5f9'
}
