# Tech Stack and Team Resources

## Members and Initial Roles
- Valeria (Me)
- Jhair (Teammate)
- Luis (Teammate)

## Defined Tech Stack
- **Frontend Framework:** React / Next.js
- **Frontend Deployment:** Vercel (to ensure automatic public URL and delivery verification timestamp)
- **Backend Framework:** Python / Django (REST Framework)
- **Backend Deployment:** Railway or AWS (EC2 with static IP)
- **Database:** Postgres or DynamoDB (and Vector DB if the AI solution requires it)
- **Required Testing Core:** Jest (for the frontend environment) and PyTest (for the backend environment)

## Available AI Budget and Resources
- **Jhair:** Advanced Claude account (High limits, $100 USD budget allocated). Focused on complex prompting, initial testing core generation, and heavy architecture design.
- **Luis and Valeria:** Standard accounts ($20 USD budget). Focused on core component development, local business logic, debugging, and real-time documentation.

## Automated Workflow Strategy
- **API Mocking:** The backend will expose mock static endpoints from hour one so the frontend can advance with UI design, loaders, and state management without being blocked by the AI API integration.
- **Git Repository:** Locally configured tonight to ensure all commits use personal emails before creating the official GitHub releases tomorrow.
