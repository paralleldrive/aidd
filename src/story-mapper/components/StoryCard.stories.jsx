import { StoryCard } from "./StoryCard.jsx";
import { createStory } from "../data-model/entities.js";

export default {
  title: "Story Mapper/StoryCard",
  component: StoryCard,
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
};

export const HighPriority = {
  args: {
    story: createStory({
      id: "USR-001",
      name: "User authentication",
      description:
        "As a user, I want to log in with OAuth, so that I can access my account securely",
      priority: "high",
      points: 8,
    }),
  },
};

export const MediumPriority = {
  args: {
    story: createStory({
      id: "USR-002",
      name: "Dashboard view",
      description:
        "As a user, I want to see my dashboard, so that I can view my activity summary",
      priority: "medium",
      points: 5,
    }),
  },
};

export const LowPriority = {
  args: {
    story: createStory({
      id: "USR-003",
      name: "Profile customization",
      description:
        "As a user, I want to customize my profile theme, so that I can personalize my experience",
      priority: "low",
      points: 2,
    }),
  },
};

export const Editable = {
  args: {
    story: createStory({
      id: "USR-004",
      name: "Click to edit",
      description:
        "As a product manager, I want to click stories to edit them, so that I can maintain accurate details",
      priority: "high",
      points: 5,
    }),
    onEdit: (story) => {
      console.log("Editing story:", story);
      alert(`Edit story: ${story.name}`);
    },
  },
};

export const LongDescription = {
  args: {
    story: createStory({
      id: "USR-005",
      name: "Complex feature with detailed requirements",
      description:
        "As a product manager, I want to create complex user stories with detailed descriptions that span multiple lines and provide comprehensive context about the feature requirements, acceptance criteria, and business value, so that the development team has all the information they need to implement the feature correctly and stakeholders understand the full scope of the work being done",
      priority: "medium",
      points: 13,
    }),
  },
};

export const MinimalStory = {
  args: {
    story: createStory({
      id: "USR-006",
      name: "Simple task",
      description: "",
      priority: "low",
      points: 1,
    }),
  },
};
