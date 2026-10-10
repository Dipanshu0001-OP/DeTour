# Detour

**Explore beyond the obvious.**

Detour is a community-first travel discovery platform for finding affordable local experiences, regional food, hidden gems, cultural stories, and community-led initiatives. The project is starting with **Dehradun and Uttarakhand**, with an approach that can expand to destinations across India.

The idea is simple: help travellers go beyond the usual checklist of attractions and discover the people, places, and stories that make a destination distinctive.

## What Detour is building

- **Personalized discovery:** Explore places according to interests, budget, trip duration, travel group, and dietary preferences.
- **Hidden gems:** Surface lesser-known experiences alongside popular highlights.
- **Budget-aware itineraries:** Organize activities into a practical trip plan and explore lower-cost alternatives.
- **Food and local culture:** Find regional dishes, traditions, crafts, and hands-on experiences.
- **Community Passport:** Learn about artisans, community-run experiences, and local initiatives.
- **Local impact:** Estimate spending with eligible local providers, with assumptions explained transparently.

## Project status

Detour is an **active hackathon MVP**. The frontend and local recommendation flow are being developed alongside AI and cloud work. Features may change as the team integrates each component.

A few important distinctions:

- Some destination entries and prices may be demo content or estimates. They should be labelled accordingly.
- Do not treat an organization as a verified NGO or partner unless its details and relationship have been checked.
- Popularity and “trending this week” claims should only be shown when supported by a real data source and a clear time window.
- Ollama/local-model support and AWS services should be described as integrated only after the relevant code is connected and tested. This project does not claim a live cloud deployment from this README.

## Technology

### Frontend

- React
- Vite
- JavaScript
- CSS
- Lucide React

### Recommendation and data direction

- Local recommendation logic for matching experiences to travel preferences
- Optional API-backed recommendations as the backend integration is completed
- Curated destination, food, and community records with provenance and estimates clearly identified

### AI and cloud work in progress

The project is exploring open-weight semantic matching and an AWS-backed API/data layer. The intended AWS architecture includes API Gateway, Lambda, DynamoDB, and CloudWatch, with frontend hosting planned through Amplify. These services should not be assumed to be deployed until a working environment and endpoint have been verified.

Ollama is available on the project lead's development machine as a possible local experimentation option. It is not a runtime requirement for the frontend, and a public deployment must not depend on a personal computer remaining online.

## Run - https://detour-theta.vercel.app/
## ☁️ AWS Cloud Architecture

Detour is designed to combine a responsive React frontend with a serverless AWS backend for destination discovery, personalized recommendations, and itinerary planning.

### AWS Services

| Technology | Purpose |
|---|---|
| **AWS SAM** | Infrastructure as Code for defining, building, validating, and deploying serverless AWS resources. |
| **Amazon API Gateway** | Exposes HTTPS endpoints for frontend requests. |
| **AWS Lambda** | Handles recommendation requests, filtering, itinerary logic, and budget calculations. |
| **Amazon DynamoDB** | Stores destination listings, local experiences, and community-provider records. |
| **Amazon CloudWatch** | Provides logs and operational monitoring for backend functions. |
| **AWS Amplify Hosting** | Hosts the React + Vite frontend. |

### Architecture Overview

```text
             Traveller
                 |
                 v
        React + Vite Frontend
                 |
                 v
          Amazon API Gateway
                 |
                 v
           AWS Lambda
        /        |        \
       v         v         v
 Recommendations Budget   Itinerary
       \         |         /
                 v
          Amazon DynamoDB

       AWS CloudWatch
       Backend Monitoring

       AWS SAM
       Infrastructure Definition
       and Deployment

       AWS Amplify Hosting
       Frontend Deployment
```

### Infrastructure as Code with AWS SAM

AWS Serverless Application Model (SAM) enables the team to define serverless infrastructure using a template, making resources easier to configure, reproduce, and deploy.

The SAM template is intended to describe the relevant backend resources, their permissions, environment variables, and configuration.

**Planned deployment workflow:**

1. Define the backend resources in the SAM template.
2. Validate and build the application.
3. Deploy the serverless stack to the configured AWS account.
4. Test API endpoints and DynamoDB operations.
5. Inspect Lambda logs and errors through CloudWatch.
6. Configure the frontend to use the deployed API endpoint.

### Deployment and Security

- Keep AWS credentials and secrets out of source control.
- Use least-privilege IAM permissions.
- Validate incoming API requests and handle errors gracefully.
- Configure the frontend with the actual deployed API URL.
- Check AWS account eligibility, service limits, and pricing before deployment.

**Implementation status:** The architecture above describes the intended cloud design. Individual services should be marked as implemented only after their configuration and functionality have been verified.

### Prerequisites

- Node.js 18 or newer (Node.js 20+ recommended)
- npm
- Git

### Setup

```bash
git clone https://github.com/Dipanshu0001-OP/DeTour.git
cd DeTour
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

To check the production bundle:

```bash
npm run build
```

If your checked-out branch places the frontend `package.json` at a different path, run these commands from that directory instead. For API-backed development, follow the environment-variable example and setup notes present in the relevant frontend/backend files. Never commit credentials or private API keys.

## Repository layout

```text
DeTour/
├── frontend/   # React + Vite user interface
├── ai/         # Recommendation / AI development
├── docs/       # Project and architecture documentation
├── infra/      # Infrastructure and deployment work
├── README.md
└── LICENSE
```

The exact contents of each directory may evolve while the team works in parallel. Infrastructure files are not evidence of a deployment by themselves.

## Data integrity principles

Detour is built around useful, trustworthy discovery. We aim to:

- identify estimated prices as estimates and represent unknown prices as unknown, not free;
- use source links or provenance for factual destination and provider information where possible;
- distinguish demo listings from confirmed providers;
- avoid invented live trends, safety claims, contact details, NGO partnerships, or verification badges;
- explain estimated local spending without presenting it as a verified donation or social outcome.

## Roadmap

- [ ] Improve and validate destination coverage, starting with Dehradun and Uttarakhand
- [ ] Complete the preference-to-recommendation-to-itinerary journey
- [ ] Test dietary, group-suitability, time, and budget constraints
- [ ] Complete semantic matching and document the model and its licence, if integrated
- [ ] Connect and test the API and AWS data workflow
- [ ] Improve loading, empty, and error states across the app
- [ ] Add end-to-end checks and deployment instructions
- [ ] Expand verified community and artisan information

## Contributing

Contributions and issue reports are welcome. Before making a substantial change, open an issue or coordinate with the team so parallel work does not overwrite another contributor's files.

1. Create a feature branch.
2. Keep changes focused and avoid committing secrets or local environment files.
3. Test the relevant frontend or backend workflow.
4. Open a pull request describing the change and the tests performed.

## Team

Detour is being developed collaboratively by a student team at Graphic Era University. The team is coordinating frontend, recommendation/AI, destination data, and cloud integration in parallel.

## License

This repository's code is licensed under the MIT License. Third-party images, datasets, models, and other assets may have separate terms; verify and follow their licences before redistribution.
