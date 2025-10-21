import { StepColumn } from "./StepColumn.jsx";
import { createStep, createStory } from "../data-model/entities.js";
import "./StepColumn.css";
import "./StoryCard.css";

export default {
  title: "Story Mapper/StepColumn",
  component: StepColumn,
  parameters: {
    layout: "centered",
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
    onEditStep: { action: "edit step" },
    onEditStory: { action: "edit story" },
  },
};

/**
 * Empty step with no stories
 */
export const EmptyStep = {
  args: {
    step: createStep({
      name: "Getting Started",
      description: "Initial setup steps",
      stories: [],
    }),
  },
};

/**
 * Step with a single story
 */
export const SingleStory = {
  args: {
    step: createStep({
      name: "User Authentication",
      description: "Login and security",
      stories: [
        createStory({
          name: "User login",
          description:
            "As a user, I want to log in so that I can access my account",
          priority: "high",
          points: 5,
        }),
      ],
    }),
  },
};

/**
 * Step with multiple stories of different priorities
 */
export const MultipleStories = {
  args: {
    step: createStep({
      name: "Dashboard Features",
      description: "Core dashboard functionality",
      stories: [
        createStory({
          name: "View dashboard",
          description: "As a user, I want to see my personalized dashboard",
          priority: "high",
          points: 8,
        }),
        createStory({
          name: "Customize widgets",
          description: "As a user, I want to customize my dashboard widgets",
          priority: "medium",
          points: 5,
        }),
        createStory({
          name: "Export data",
          description: "As a user, I want to export my dashboard data",
          priority: "low",
          points: 3,
        }),
      ],
    }),
  },
};

/**
 * Step with many stories (stress test)
 */
export const ManyStories = {
  args: {
    step: createStep({
      name: "User Profile",
      description: "User profile management",
      stories: [
        createStory({ name: "View profile", priority: "high", points: 3 }),
        createStory({ name: "Edit profile", priority: "high", points: 5 }),
        createStory({ name: "Upload avatar", priority: "medium", points: 3 }),
        createStory({ name: "Change password", priority: "high", points: 3 }),
        createStory({ name: "Delete account", priority: "low", points: 2 }),
        createStory({
          name: "Privacy settings",
          priority: "medium",
          points: 5,
        }),
      ],
    }),
  },
};

/**
 * Step with editable functionality (click to edit)
 */
export const Editable = {
  args: {
    step: createStep({
      name: "Payment Processing",
      description: "Payment and checkout features",
      stories: [
        createStory({
          name: "Process payment",
          description: "As a user, I want to complete payment securely",
          priority: "high",
          points: 13,
        }),
        createStory({
          name: "Save payment method",
          description:
            "As a user, I want to save my payment method for future use",
          priority: "medium",
          points: 5,
        }),
      ],
    }),
    onEditStep: (step) => alert(`Edit step: ${step.name}`),
    onEditStory: (story) => alert(`Edit story: ${story.name}`),
  },
};
