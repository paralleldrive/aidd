import { describe, test } from "vitest";
import { assert } from "riteway/vitest";
import {
  storyMapToProject,
  projectToStoryMap,
  storyToUserStory,
  userStoryToStory,
} from "./genai-transformers.js";
import { createJourney, createStep, createStory } from "./entities.js";

describe("storyToUserStory", () => {
  test("converts story to ProductManager UserStory format", async () => {
    const story = createStory({
      name: "User login",
      description:
        "As a user, I want to log in so that I can access my account",
      priority: "high",
      points: 5,
    });

    const userStory = storyToUserStory(story);

    assert({
      given: "a story entity",
      should: "preserve ID",
      actual: userStory.id,
      expected: story.id,
    });

    assert({
      given: "a story entity",
      should: "preserve name",
      actual: userStory.name,
      expected: "User login",
    });

    assert({
      given: "a story entity",
      should: "preserve description",
      actual: userStory.description,
      expected: "As a user, I want to log in so that I can access my account",
    });

    assert({
      given: "a story entity",
      should: "include timestamps",
      actual: userStory.createdAt !== undefined,
      expected: true,
    });
  });
});

describe("userStoryToStory", () => {
  test("converts ProductManager UserStory to story entity", async () => {
    const userStory = {
      id: "test123",
      name: "User signup",
      description: "As a new user, I want to create an account",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const story = userStoryToStory(userStory);

    assert({
      given: "a UserStory object",
      should: "preserve ID",
      actual: story.id,
      expected: "test123",
    });

    assert({
      given: "a UserStory object",
      should: "preserve name",
      actual: story.name,
      expected: "User signup",
    });

    assert({
      given: "a UserStory object",
      should: "set default priority",
      actual: story.priority,
      expected: "medium",
    });

    assert({
      given: "a UserStory object",
      should: "set default points",
      actual: story.points,
      expected: 3,
    });
  });
});

describe("storyMapToProject", () => {
  test("converts story map to ProductManager Project format", async () => {
    const storyMap = {
      journeys: [
        createJourney({
          name: "User Onboarding",
          description: "New user onboarding flow",
          steps: [
            createStep({
              name: "Account Setup",
              stories: [
                createStory({
                  name: "Sign up",
                  description: "As a user, I want to create an account",
                }),
              ],
            }),
          ],
        }),
      ],
    };

    const project = storyMapToProject(storyMap, "Test Project");

    assert({
      given: "story map with journeys",
      should: "have project name",
      actual: project.name,
      expected: "Test Project",
    });

    assert({
      given: "story map with journeys",
      should: "have storyMap with userJourneys",
      actual: project.storyMap.userJourneys.length,
      expected: 1,
    });

    assert({
      given: "story map with journeys",
      should: "preserve journey name",
      actual: project.storyMap.userJourneys[0].name,
      expected: "User Onboarding",
    });

    assert({
      given: "story map with journeys",
      should: "convert steps to ProductManager format",
      actual: project.storyMap.userJourneys[0].steps.length,
      expected: 1,
    });
  });
});

describe("projectToStoryMap", () => {
  test("converts ProductManager Project to story map format", async () => {
    const project = {
      name: "Test Project",
      storyMap: {
        userJourneys: [
          {
            id: "journey1",
            name: "Authentication",
            description: "User authentication flow",
            steps: [
              {
                id: "step1",
                name: "Login",
                description: "User login step",
                userStories: [
                  {
                    id: "story1",
                    name: "User login",
                    description: "As a user, I want to log in",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  },
                ],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      },
    };

    const storyMap = projectToStoryMap(project);

    assert({
      given: "ProductManager project",
      should: "extract journeys array",
      actual: storyMap.journeys.length,
      expected: 1,
    });

    assert({
      given: "ProductManager project",
      should: "preserve journey name",
      actual: storyMap.journeys[0].name,
      expected: "Authentication",
    });

    assert({
      given: "ProductManager project",
      should: "convert steps",
      actual: storyMap.journeys[0].steps.length,
      expected: 1,
    });

    assert({
      given: "ProductManager project",
      should: "convert stories",
      actual: storyMap.journeys[0].steps[0].stories.length,
      expected: 1,
    });
  });

  test("handles empty project gracefully", async () => {
    const project = {
      name: "Empty Project",
      storyMap: {
        userJourneys: [],
      },
    };

    const storyMap = projectToStoryMap(project);

    assert({
      given: "empty project",
      should: "return empty journeys array",
      actual: storyMap.journeys.length,
      expected: 0,
    });
  });
});
