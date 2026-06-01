import type { ResumeData } from "./data";
import { defaultResumeData } from "./default";
import { generateId } from "@/lib/utils/string";

function buildGlowmindsSample(): ResumeData {
	const data = structuredClone(defaultResumeData);
	const profileId = generateId();
	const githubId = generateId();
	const expId = generateId();
	const eduId = generateId();
	const projectId = generateId();
	const reactSkillId = generateId();
	const nodeSkillId = generateId();
	const langSkillId = generateId();

	data.basics = {
		...data.basics,
		name: "Rinku Soni",
		headline: "Software Engineer | React, Node.js & Full-Stack Development",
		email: "rinku.soni@email.com",
		phone: "+91 11111 11111",
		location: "Jaipur, Rajasthan",
		website: { url: "", label: "" },
		customFields: [],
	};

	data.summary.content =
		"<p><strong>Motivated B.Tech graduate and aspiring software engineer</strong> with hands-on experience building web applications using React, Node.js, and REST APIs. Comfortable across the JavaScript stack with practical exposure to Python, SQL, and Git in academic and internship projects. Eager to contribute to product-focused teams in the Indian tech ecosystem.</p>";

	data.sections.profiles.items = [
		{
			id: profileId,
			hidden: false,
			icon: "linkedin-logo",
			iconColor: "",
			network: "LinkedIn",
			username: "rinku-soni-dev",
			website: {
				url: "https://linkedin	com/in/rinku-soni-dev",
				label: "linkedin.com/in/rinku-soni-dev",
				inlineLink: false,
			},
		},
		{
			id: githubId,
			hidden: false,
			icon: "github-logo",
			iconColor: "",
			network: "GitHub",
			username: "arjunmehta-dev",
			website: {
				url: "https://github.com/rinku-soni-dev",
				label: "github.com/rinku-soni-dev",
				inlineLink: false,
			},
		},
	];

	data.sections.experience.items = [
		{
			id: expId,
			hidden: false,
			company: "TechNova Solutions",
			position: "Software Engineering Intern",
			location: "Bengaluru, Karnataka (Hybrid)",
			period: "June 2025 - August 2025",
			website: { url: "", label: "", inlineLink: false },
			roles: [],
			description:
				"<ul><li><p>Built React dashboards and Node.js REST APIs for an internal hiring tool used by 40+ recruiters</p></li><li><p>Integrated PostgreSQL queries and wrote unit tests; reduced manual data entry by ~30%</p></li><li><p>Collaborated in Agile sprints with Git flow, code reviews, and daily stand-ups</p></li></ul>",
		},
	];

	data.sections.education.items = [
		{
			id: eduId,
			hidden: false,
			school: "Dronacharya Group of Institutions",
			degree: "Bachelor of Technology",
			area: "Computer Science and Engineering",
			grade: "8.2 CGPA",
			location: "Bengaluru, Karnataka",
			period: "2022 - 2026",
			website: { url: "", label: "", inlineLink: false },
			description:
				"<p>Coursework: Data Structures, DBMS, Operating Systems, Web Technologies, Machine Learning fundamentals</p>",
		},
	];

	data.sections.projects.items = [
		{
			id: projectId,
			hidden: false,
			name: "Campus Placement Tracker",
			period: "2025",
			website: {
				url: "https://github.com/rinku-soni-dev/placement-tracker",
				label: "View on GitHub",
				inlineLink: false,
			},
			description:
				"<p>Full-stack MERN app for students to track applications, interview rounds, and offers. Features JWT auth, role-based access, and export to PDF. Deployed on Render with MongoDB Atlas.</p>",
		},
	];

	data.sections.skills.items = [
		{
			id: reactSkillId,
			hidden: false,
			icon: "code",
			iconColor: "",
			name: "Frontend",
			proficiency: "Intermediate",
			level: 3,
			keywords: ["React", "JavaScript", "HTML", "CSS"],
		},
		{
			id: nodeSkillId,
			hidden: false,
			icon: "brackets-curly",
			iconColor: "",
			name: "Backend",
			proficiency: "Intermediate",
			level: 3,
			keywords: ["Node.js", "Express", "REST APIs"],
		},
		{
			id: langSkillId,
			hidden: false,
			icon: "database",
			iconColor: "",
			name: "Tools & Languages",
			proficiency: "Intermediate",
			level: 3,
			keywords: ["Python", "SQL", "Git", "PostgreSQL"],
		},
	];

	return data;
}

export const glowmindsSampleResumeData: ResumeData = buildGlowmindsSample();
