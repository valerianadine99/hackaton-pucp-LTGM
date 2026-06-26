# VibeCoding Tournament Rules
Developer Student Club PUCP
June 26, 2026

## Executive Summary
The VibeCoding Tournament is a one-day hackathon organized by the Developer Student Club PUCP where teams build real software, accelerated by generative artificial intelligence. The challenge is not just to make something work, but to demonstrate the engineering behind every decision.

## General Objective
To promote the responsible and technical use of generative AI tools in software development, fostering the creation of functional prototypes with solid architecture, teamwork, and critical thinking regarding the produced code.

## Schedule and Format
- Time: 09:00 AM — 08:00 PM
- Format: 10 teams of 3 members
- Dynamics: The theme will be revealed on the day of the event at 09:30 AM during the Kickoff. Commit history will be reviewed.

## Deliverables and Mandatory Milestones

### Milestone 1 - Architecture Prototype (Suggested Deadline: 11:30 AM)
During Sprint 0 (10:45 AM — 11:30 AM), teams are only allowed to write code to create an architecture prototype and document the project. Upon completion, each team must launch a **GitHub Release** titled “Prototipo de arquitectura - [Project Name]” containing:
- **README.md** including: Project name, short description (max 3 lines), problem solved and target user, tech stack, local installation/run instructions, AI models to be used, member names, and defined roles.
- **Architecture and/or design diagrams** in PDF or `.md` (Mermaid) format inside the `/docs` folder, showing the main system modules and how they communicate.
- **Optional:** Data models, deployment diagrams, relevant prompts used, etc.

### Milestone 2 — Final Delivery (Strict Deadline: 18:00 PM)
Each team must launch a **GitHub Release** titled “Entrega final - [Project Name]” containing:
- Updated **README.md** reflecting the final state of the project with relevant indexes/appendixes.
- Complete production code.
- **Documented design and architecture decisions:** The use of ADRs inside the `/docs/adr/` folder is highly recommended.
- **Functional production URL** publicly deployed on the platform of your choice (e.g., Vercel). Pre-recorded demos are not accepted.
- **Automated Testing (Testing Core):** A test suite (Unit or Integration, e.g., Jest, PyTest) validating the happy path and one error case of the system's most critical functionality. A high coverage percentage is not required; the goal is to demonstrate the ability to validate AI-generated code automatically.

### Milestone 3 — Pitch (18:00 PM — 19:15 PM)
- 5-minute presentation and 2 minutes of Q&A from the jury regarding any part of the code.
- Live demonstration from the production URL and technical justification of the main decisions.

## Evaluation Rubric
- Architecture and Engineering: 40%
- Functionality and Deployment: 30%
- UX/UI and Creative Adaptation: 15%
- Pitch and Business Case: 15%

## Rules and Proper Use of AI
- The use of any publicly available AI model and AI-assisted development tool is permitted.
- Judges may request technical explanations about any part of the code. The team is responsible for understanding what they built.
- Submissions outside the established hours will not be considered (the exact timestamp of the GitHub release will be checked).
- AI usage should focus on: validating architectural decisions, accelerating tedious tasks (boilerplate, testing setup, typing, documentation), and debugging analytically rather than blindly copying code.
