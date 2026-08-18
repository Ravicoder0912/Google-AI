import { PresetTemplate } from "../types";

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "job-offer-startup-vs-bigtech",
    title: "Startup Lead Role vs. Big Tech Senior Engineer Offer",
    category: "Career & Work",
    description: "Deciding between high equity upside and ownership vs. high base stability, brand recognition, and 401(k) matching.",
    options: [
      {
        name: "Series-B Startup (Head of Eng / Early Lead)",
        description: "Lower base salary, significant equity potential (0.8%), rapid decision-making, high ownership, but fast runway pressure.",
      },
      {
        name: "Tier-1 Tech Giant (Senior Staff / L6)",
        description: "Top-tier guaranteed compensation (cash + liquid RSUs), structured ladder, mentorship, better 40-hr boundaries, but more bureaucracy.",
      },
    ],
    context: "I have 6 years of experience, have 6 months of emergency savings, and want to accelerate my growth without burning out completely.",
    priorities: ["Rapid Career Trajectory", "High Total Compensation", "Autonomy & Ownership", "Work-Life Balance"],
    riskTolerance: "balanced",
    timeHorizon: "medium_term",
  },
  {
    id: "housing-buy-vs-rent",
    title: "Buy a Suburban Home vs. Rent & Invest Aggressively in Stocks",
    category: "Personal Finance",
    description: "Evaluating the financial and lifestyle trade-offs between property ownership with a 30-year mortgage versus renting and investing the difference.",
    options: [
      {
        name: "Purchase Single-Family Home ($550k, 20% down)",
        description: "Fixed monthly mortgage principal/interest, property appreciation, stability, but tied down with HOA, maintenance, property taxes, and closing fees.",
      },
      {
        name: "Rent Apartment & Dollar-Cost-Average in Index Funds",
        description: "Maximum mobility, zero repair liabilities, reinvesting down payment ($110k) and monthly savings into broad S&P 500 / total market ETFs.",
      },
    ],
    context: "Current interest rates are ~6.5%. I am unsure if I will stay in this metro area for more than 4 years.",
    priorities: ["Net Worth Growth (10 yr)", "Geographic Flexibility", "Low Stress / Predictability", "Personal Living Quality"],
    riskTolerance: "conservative",
    timeHorizon: "long_term",
  },
  {
    id: "tech-stack-monolith-vs-microservices",
    title: "Modular Monolith vs. Microservices Architecture for New SaaS",
    category: "Engineering Architecture",
    description: "Choosing the foundational backend architecture for an early-stage B2B SaaS platform planned for 50k active users in year 1.",
    options: [
      {
        name: "Modular Monolith (Next.js/Express + PostgreSQL)",
        description: "Single deployment artifact, instant local dev loop, atomic ACID transactions, very low operational overhead.",
      },
      {
        name: "Microservices (Event-Driven Go/Node Services + Kafka + Kubernetes)",
        description: "Independent service scalability, fault isolation, polyglot tech flexibility, but high devops complexity and distributed tracing overhead.",
      },
    ],
    context: "Our engineering team currently has 3 full-stack engineers and we need to launch MVP in 60 days.",
    priorities: ["Speed to Market", "Low DevOps Maintenance Overhead", "Developer Velocity", "Future Scalability"],
    riskTolerance: "conservative",
    timeHorizon: "short_term",
  },
  {
    id: "relocation-city-vs-hometown",
    title: "Relocate to Major Tech Hub vs. Stay Remote in Affordable Hometown",
    category: "Lifestyle & Location",
    description: "Weighing serendipity, networking, and cultural density against low cost of living, proximity to family, and lower daily friction.",
    options: [
      {
        name: "Move to Tier-1 Hub (San Francisco / New York)",
        description: "Dense serendipitous encounters, in-person meetups, elite talent network, vibrant cultural scene, but 3x rent and living costs.",
      },
      {
        name: "Stay in Mid-Sized Hometown (Remote / Low CoL)",
        description: "Close to family/friends, spacious housing for half the price, minimal commute stress, but fewer spontaneous in-person career opportunities.",
      },
    ],
    context: "I value relationships and physical space, but also worry about missing out on serendipitous career leaps in my late 20s.",
    priorities: ["Family & Social Support", "Long-term Savings Rate", "Career Networking Serendipity", "Daily Peace of Mind"],
    riskTolerance: "balanced",
    timeHorizon: "medium_term",
  },
  {
    id: "education-mba-vs-direct-promotion",
    title: "Top-10 MBA Program vs. Staying in Current Industry & Upskilling",
    category: "Education & Growth",
    description: "Deciding whether to take on 2 years of opportunity cost and tuition for an elite credential or climb internally.",
    options: [
      {
        name: "Full-Time Top-10 MBA (2 Years)",
        description: "Global alumni network, structured pivot into Strategy/Consulting/Product, prestige credential, but $200k tuition + 2 years lost earnings.",
      },
      {
        name: "Direct Promotion Track & Targeted Executive Certifications",
        description: "Zero debt, continuous income earning, immediate leadership experience, but slower brand-name pivot if switching industries.",
      },
    ],
    context: "Want to transition from engineering into product management or general management within 3 years.",
    priorities: ["Speed of Role Transition", "Debt Avoidance / Financial ROI", "Alumni Network Leverage", "Immediate Practical Experience"],
    riskTolerance: "balanced",
    timeHorizon: "long_term",
  },
];
