import { createId } from "@paralleldrive/cuid2";

/**
 * Converts a Story entity to ProductManager UserStory format
 * @param {Object} story - Story entity
 * @returns {Object} UserStory in ProductManager format
 */
export const storyToUserStory = (story) => {
  return {
    id: story.id,
    name: story.name,
    description: story.description,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    // ProductManager UserStory fields (optional)
    ...(story.priority && { priority: story.priority }),
    ...(story.points && { points: story.points }),
    ...(story.status && { status: { state: story.status } }),
  };
};

/**
 * Converts ProductManager UserStory to Story entity format
 * @param {Object} userStory - UserStory from ProductManager
 * @returns {Object} Story entity
 */
export const userStoryToStory = (userStory) => {
  return {
    id: userStory.id || createId(),
    name: userStory.name,
    description: userStory.description || "",
    priority: userStory.priority || "medium",
    points: userStory.points || 3,
    status: userStory.status?.state || "backlog",
    createdAt: userStory.createdAt || Date.now(),
    updatedAt: userStory.updatedAt || Date.now(),
  };
};

/**
 * Converts a Step entity to ProductManager Step format
 * @param {Object} step - Step entity
 * @returns {Object} Step in ProductManager format
 */
export const stepToProductManagerStep = (step) => {
  return {
    id: step.id,
    name: step.name,
    description: step.description,
    userStories: (step.stories || []).map(storyToUserStory),
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
  };
};

/**
 * Converts ProductManager Step to Step entity format
 * @param {Object} pmStep - Step from ProductManager
 * @returns {Object} Step entity
 */
export const productManagerStepToStep = (pmStep) => {
  return {
    id: pmStep.id || createId(),
    name: pmStep.name,
    description: pmStep.description || "",
    stories: (pmStep.userStories || []).map(userStoryToStory),
    createdAt: pmStep.createdAt || Date.now(),
    updatedAt: pmStep.updatedAt || Date.now(),
  };
};

/**
 * Converts a Journey entity to ProductManager UserJourney format
 * @param {Object} journey - Journey entity
 * @returns {Object} UserJourney in ProductManager format
 */
export const journeyToUserJourney = (journey) => {
  return {
    id: journey.id,
    name: journey.name,
    description: journey.description,
    steps: (journey.steps || []).map(stepToProductManagerStep),
    createdAt: journey.createdAt,
    updatedAt: journey.updatedAt,
  };
};

/**
 * Converts ProductManager UserJourney to Journey entity format
 * @param {Object} userJourney - UserJourney from ProductManager
 * @returns {Object} Journey entity
 */
export const userJourneyToJourney = (userJourney) => {
  return {
    id: userJourney.id || createId(),
    name: userJourney.name,
    description: userJourney.description || "",
    steps: (userJourney.steps || []).map(productManagerStepToStep),
    createdAt: userJourney.createdAt || Date.now(),
    updatedAt: userJourney.updatedAt || Date.now(),
  };
};

/**
 * Converts story map to ProductManager Project format
 * @param {Object} storyMap - Story map with journeys array
 * @param {string} projectName - Name for the project
 * @returns {Object} Project in ProductManager format
 */
export const storyMapToProject = (storyMap, projectName = "Story Map") => {
  const now = Date.now();
  return {
    id: createId(),
    name: projectName,
    description: `Story map for ${projectName}`,
    storyMap: {
      userJourneys: (storyMap.journeys || []).map(journeyToUserJourney),
    },
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Converts ProductManager Project to story map format
 * @param {Object} project - Project from ProductManager
 * @returns {Object} Story map with journeys array
 */
export const projectToStoryMap = (project) => {
  return {
    journeys: (project.storyMap?.userJourneys || []).map(userJourneyToJourney),
  };
};
