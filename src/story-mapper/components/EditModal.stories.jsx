import { EditModal } from "./EditModal.jsx";
import {
  createStory,
  createStep,
  createJourney,
} from "../data-model/entities.js";
import "./EditModal.css";

export default {
  title: "Story Mapper/EditModal",
  component: EditModal,
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
    onClose: { action: "closed" },
    onSave: { action: "saved" },
  },
};

/**
 * Modal for editing a user story with all story-specific fields
 */
export const EditStory = {
  args: {
    isOpen: true,
    entityType: "story",
    entity: createStory({
      name: "User login",
      description:
        "As a user, I want to log in so that I can access my account",
      priority: "high",
      points: 5,
    }),
  },
};

/**
 * Modal for editing a step (no priority or points fields)
 */
export const EditStep = {
  args: {
    isOpen: true,
    entityType: "step",
    entity: createStep({
      name: "User Authentication",
      description: "Steps for user to authenticate and access the system",
    }),
  },
};

/**
 * Modal for editing a journey (no priority or points fields)
 */
export const EditJourney = {
  args: {
    isOpen: true,
    entityType: "journey",
    entity: createJourney({
      name: "User Onboarding",
      description: "Complete journey for onboarding new users to the platform",
    }),
  },
};

/**
 * Modal closed state (not visible)
 */
export const Closed = {
  args: {
    isOpen: false,
    entityType: "story",
    entity: createStory({
      name: "Hidden story",
      description: "This modal should not be visible",
    }),
  },
};

/**
 * Story with medium priority
 */
export const MediumPriorityStory = {
  args: {
    isOpen: true,
    entityType: "story",
    entity: createStory({
      name: "Dashboard view",
      description: "As a user, I want to see my personalized dashboard",
      priority: "medium",
      points: 3,
    }),
  },
};

/**
 * Story with low priority and minimal points
 */
export const LowPriorityStory = {
  args: {
    isOpen: true,
    entityType: "story",
    entity: createStory({
      name: "Update footer links",
      description:
        "As a user, I want updated footer links for better navigation",
      priority: "low",
      points: 1,
    }),
  },
};
