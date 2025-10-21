import { createId } from "@paralleldrive/cuid2";

/**
 * Create a user story following the ProductManager schema
 * @param {Object} params - Story parameters
 * @param {string} params.name - Story name/title
 * @param {string} [params.description=''] - Story description (user story format)
 * @param {string} [params.priority='medium'] - Priority: 'high' | 'medium' | 'low'
 * @param {number} [params.points=3] - Story point estimate
 * @param {string} [params.status='backlog'] - Status: 'backlog' | 'inProgress' | 'released' | 'cancelled'
 * @param {string} [params.id] - Optional custom ID
 * @returns {Object} Story object
 */
export const createStory = ({
  id = createId(),
  name,
  description = "",
  priority = "medium",
  points = 3,
  status = "backlog",
} = {}) => {
  const now = Date.now();

  return {
    id,
    name,
    description,
    priority,
    points,
    status,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Create a step following the ProductManager schema
 * @param {Object} params - Step parameters
 * @param {string} params.name - Step name
 * @param {string} [params.description=''] - Step description
 * @param {Array} [params.stories=[]] - Array of story objects
 * @param {string} [params.id] - Optional custom ID
 * @returns {Object} Step object
 */
export const createStep = ({
  id = createId(),
  name,
  description = "",
  stories = [],
} = {}) => {
  const now = Date.now();

  return {
    id,
    name,
    description,
    stories,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Create a user journey following the ProductManager schema
 * @param {Object} params - Journey parameters
 * @param {string} params.name - Journey name
 * @param {string} [params.description=''] - Journey description
 * @param {Array} [params.steps=[]] - Array of step objects
 * @param {string} [params.id] - Optional custom ID
 * @returns {Object} Journey object
 */
export const createJourney = ({
  id = createId(),
  name,
  description = "",
  steps = [],
} = {}) => {
  const now = Date.now();

  return {
    id,
    name,
    description,
    steps,
    createdAt: now,
    updatedAt: now,
  };
};
