# 🧭 Detour
### Explore beyond the obvious.

**Your destination is only the beginning.**

Detour is a personalized travel discovery platform built to help people explore beyond the usual tourist checklist. It connects travelers with experiences that fit their interests, budget, travel style, and dietary preferences, while bringing hidden gems and local communities into the spotlight.

Instead of asking only *“Where should I go?”*, Detour asks a better question:

**“What kind of experience do you want to have?”**

---

## 🌍 The Problem

Travel planning has never had more information. Yet finding the *right* experience remains surprisingly difficult.

- **Too much noise:** Popular search results repeatedly surface the same tourist attractions.
- **Poor personalization:** Recommendations rarely account for the full combination of interests, budget, group type, and dietary needs.
- **Hidden gems stay hidden:** Small local businesses, independent artisans, and community-run experiences can be difficult to discover.
- **Budget uncertainty:** Travelers struggle to build an itinerary that fits their budget without sacrificing the experiences they care about.

The result? Travelers often visit the places everyone knows, while missing the experiences that make a destination memorable.

## 💡 The Detour Approach

Detour turns travel preferences into a more personal discovery experience.

Travelers share what matters to them. Detour uses that context to surface relevant places, organize potential experiences into an itinerary, and help users explore alternatives that better fit their budget.

The goal is simple:

**Less generic sightseeing. More meaningful discovery.**

## ✨ What You Can Explore

| Feature | What it does |
|---|---|
| 🎯 Personalized Discovery | Finds experiences aligned with your interests, budget, and travel style. |
| 💎 Hidden Gems | Helps travelers look beyond the obvious tourist attractions. |
| 🗺️ Itinerary Builder | Organizes selected experiences into a practical travel plan. |
| 💸 Budget Rescue | Explores lower-cost alternatives to help keep a trip within budget. |
| 🌱 Community Passport | Highlights local businesses, independent creators, artisans, and community-led experiences. |
| 🥗 Preference-Aware Planning | Accounts for relevant dietary and group preferences when matching experiences. |

*Features and integrations are being developed collaboratively. Availability may vary as the project evolves.*

## 🧠 A More Context-Aware Recommendation Experience

A useful travel recommendation should be more than a popular place with a matching keyword.

Detour's recommendation approach combines preference-aware matching with practical constraints. The intended experience prioritizes relevance while keeping budget, group suitability, and dietary requirements in view.

The planned recommendation pipeline:

1. **Understand** the traveler's preferences and constraints.
2. **Retrieve** candidate experiences from the available destination data.
3. **Match** experiences against interests and travel context.
4. **Rank** compatible options and explain why they fit.
5. **Build** an itinerary from suitable recommendations.
6. **Optimize** the plan with alternatives when the budget needs adjustment.

The team is developing the recommendation and AI components alongside the frontend and cloud integration.

## 🏘️ Travel That Includes Local Communities

A destination is more than its landmarks.

It is also the neighborhood café, the family-run workshop, the independent guide, the regional craft, and the people who make a place distinctive.

Detour aims to make these experiences easier to discover through its community-focused discovery features.

Where reliable data is available, community information can help travelers understand who operates an experience and how to find it. Verification, pricing, and impact information should be presented only when supported by appropriate data.

**The principle:** local discovery should be useful to travelers and respectful of the communities they visit.

## 🏗️ Technology Stack

### Frontend
- **React** for component-based UI
- **Vite** for development and production builds
- **JavaScript** for application logic
- **CSS** for responsive styling
- **Lucide React** for interface icons

### AI and Recommendations
- Preference-aware recommendation logic
- Exploration of open-weight model integration for semantic matching
- Constraint-aware filtering and ranking

### AWS Cloud Architecture
The planned cloud architecture separates the user interface from the recommendation API and destination data.

| Component | Intended responsibility |
|---|---|
| AWS Amplify Hosting | Frontend deployment |
| Amazon API Gateway | HTTP API entry point |
| AWS Lambda | Serverless recommendation handler |
| Amazon DynamoDB | Destination and community data storage |
| Amazon CloudWatch | Logs and operational visibility |

The final deployed architecture will reflect the AWS services actually configured and tested by the team.

## 🔄 How It Works

```text
┌──────────────────────────┐
│       Traveler           │
│ Interests • Budget       │
│ Group • Dietary Needs    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│    Detour Web App        │
│   React + Vite           │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Recommendation Engine    │
│ Matching • Filtering     │
│ Ranking • Explanations   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│     Experience Plan      │
│ Places • Itinerary       │
│ Budget Alternatives      │
└──────────────────────────┘
```

The cloud-backed version is designed to route recommendation requests through AWS services and use centralized destination data. A local recommendation fallback is available in the frontend, allowing development and testing without depending on the cloud endpoint.

## 🚀 Run Locally

### Prerequisites

- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Dipanshu0001-OP/Aws-hackathon.git
cd Aws-hackathon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed in your terminal, usually `http://localhost:5173`.

### 4. Create a production build

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### Environment configuration

If using the cloud-backed recommendation API, configure the frontend's API URL in a local `.env` file:

```env
VITE_API_URL=your_api_gateway_base_url
```

Use the actual deployed API base URL. Keep AWS credentials and other secrets out of frontend environment variables and source control.

Without the API URL, the application can use its local recommendation implementation.

## 🧪 Project Status

Detour is being developed as a collaborative hackathon project.

- [x] React + Vite frontend
- [x] Preference-driven discovery flow
- [x] Local recommendation and itinerary utilities
- [x] Budget and community discovery interfaces
- [x] Local fallback for recommendation requests
- [ ] Open-weight semantic recommendation integration
- [ ] Final destination dataset and data validation
- [ ] End-to-end AWS API and database integration
- [ ] Production deployment and complete integration testing

Items above describe the project at its current development stage and should be updated as each component is completed and verified.

## 👥 The Team

Built collaboratively by:

- **Saloni** · Frontend, UI/UX, and application integration
- **Dipanshu** · AI and recommendation engine
- **Srishti** · Destination data and AWS backend

## 🎯 Our Vision

We believe the best travel experiences are not always the most famous, the most expensive, or the most frequently recommended.

Sometimes, they're one turn away from the usual route.

Detour is being built to help travelers find those experiences, make better use of their budgets, and discover more of the places and people that make every destination unique.

**Don't just visit a place. Find your own way through it.**

---

### 📜 License

A repository license has not yet been specified in this README. Add the appropriate open-source license file before presenting the project as open-source licensed.

### 🤝 Contributions

Suggestions, issues, and contributions are welcome as the project evolves. Please check the repository for its current contribution guidelines and project status before opening a pull request.
