import { JourneyRow } from "./JourneyRow.jsx";
import {
  createJourney,
  createStep,
  createStory,
} from "../data-model/entities.js";
import "./JourneyRow.css";
import "./StepColumn.css";
import "./StoryCard.css";

export default {
  title: "Story Mapper/JourneyRow",
  component: JourneyRow,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value:
            "linear-gradient(135deg, #0a0a1f 0%, #1a0a2e 50%, #16213e 100%)",
        },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onEditJourney: { action: "edit journey" },
    onEditStep: { action: "edit step" },
    onEditStory: { action: "edit story" },
  },
};

/**
 * Empty journey with no steps - cyan variant
 */
export const EmptyJourneyCyan = {
  args: {
    journey: createJourney({
      name: "User Onboarding",
      description: "Complete onboarding flow for new users",
      steps: [],
    }),
    variant: "cyan",
  },
};

/**
 * Empty journey with no steps - magenta variant
 */
export const EmptyJourneyMagenta = {
  args: {
    journey: createJourney({
      name: "Premium Features",
      description: "Premium tier functionality",
      steps: [],
    }),
    variant: "magenta",
  },
};

/**
 * Journey with single step and stories - cyan variant
 */
export const SingleStepCyan = {
  args: {
    journey: createJourney({
      name: "Authentication Journey",
      description: "User authentication and security",
      steps: [
        createStep({
          name: "Login Flow",
          description: "Steps for user login",
          stories: [
            createStory({
              name: "User login",
              description:
                "As a user, I want to log in so that I can access my account",
              priority: "high",
              points: 5,
            }),
            createStory({
              name: "Password reset",
              description:
                "As a user, I want to reset my password if I forget it",
              priority: "high",
              points: 3,
            }),
          ],
        }),
      ],
    }),
    variant: "cyan",
  },
};

/**
 * Journey with multiple steps - magenta variant
 */
export const MultipleStepsMagenta = {
  args: {
    journey: createJourney({
      name: "E-commerce Flow",
      description: "Complete shopping experience",
      steps: [
        createStep({
          name: "Browse Products",
          description: "Product discovery and browsing",
          stories: [
            createStory({
              name: "View product catalog",
              description: "As a customer, I want to browse products",
              priority: "high",
              points: 8,
            }),
            createStory({
              name: "Filter products",
              description:
                "As a customer, I want to filter products by category",
              priority: "medium",
              points: 5,
            }),
          ],
        }),
        createStep({
          name: "Shopping Cart",
          description: "Cart management",
          stories: [
            createStory({
              name: "Add to cart",
              description: "As a customer, I want to add products to my cart",
              priority: "high",
              points: 5,
            }),
            createStory({
              name: "Update quantities",
              description: "As a customer, I want to change item quantities",
              priority: "medium",
              points: 3,
            }),
          ],
        }),
        createStep({
          name: "Checkout",
          description: "Complete purchase",
          stories: [
            createStory({
              name: "Enter shipping info",
              description: "As a customer, I want to enter my shipping address",
              priority: "high",
              points: 5,
            }),
            createStory({
              name: "Process payment",
              description: "As a customer, I want to pay securely",
              priority: "high",
              points: 13,
            }),
          ],
        }),
      ],
    }),
    variant: "magenta",
  },
};

/**
 * Full journey with editable functionality - cyan variant
 */
export const EditableCyan = {
  args: {
    journey: createJourney({
      name: "User Dashboard",
      description: "Main application dashboard",
      steps: [
        createStep({
          name: "Overview",
          stories: [
            createStory({
              name: "View metrics",
              priority: "high",
              points: 8,
            }),
          ],
        }),
        createStep({
          name: "Reports",
          stories: [
            createStory({
              name: "Generate report",
              priority: "medium",
              points: 5,
            }),
            createStory({
              name: "Export data",
              priority: "low",
              points: 3,
            }),
          ],
        }),
      ],
    }),
    variant: "cyan",
    onEditJourney: (journey) => alert(`Edit journey: ${journey.name}`),
    onEditStep: (step) => alert(`Edit step: ${step.name}`),
    onEditStory: (story) => alert(`Edit story: ${story.name}`),
  },
};

/**
 * Complex journey with many steps - magenta variant
 */
export const ComplexJourneyMagenta = {
  args: {
    journey: createJourney({
      name: "Platform Administration",
      description: "Admin and configuration features",
      steps: [
        createStep({
          name: "User Management",
          stories: [
            createStory({ name: "List users", priority: "high", points: 5 }),
            createStory({ name: "Create user", priority: "high", points: 5 }),
            createStory({
              name: "Edit permissions",
              priority: "medium",
              points: 8,
            }),
          ],
        }),
        createStep({
          name: "Settings",
          stories: [
            createStory({ name: "Configure app", priority: "high", points: 8 }),
            createStory({
              name: "Manage integrations",
              priority: "medium",
              points: 5,
            }),
          ],
        }),
        createStep({
          name: "Analytics",
          stories: [
            createStory({
              name: "View analytics",
              priority: "medium",
              points: 8,
            }),
            createStory({ name: "Custom reports", priority: "low", points: 5 }),
          ],
        }),
        createStep({
          name: "Security",
          stories: [
            createStory({ name: "Audit logs", priority: "high", points: 8 }),
            createStory({ name: "2FA setup", priority: "high", points: 5 }),
          ],
        }),
      ],
    }),
    variant: "magenta",
    onEditJourney: (journey) => alert(`Edit journey: ${journey.name}`),
    onEditStep: (step) => alert(`Edit step: ${step.name}`),
    onEditStory: (story) => alert(`Edit story: ${story.name}`),
  },
};
