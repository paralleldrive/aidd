import { describe, test } from 'vitest';
import { assert } from 'riteway/vitest';
import { createStory, createStep, createJourney } from './entities.js';

describe('createStory', () => {
  test('basic story creation', async () => {
    {
      const story = createStory({
        name: 'User login',
        description: 'As a user, I want to log in, so that I can access my account'
      });

      assert({
        given: 'name and description',
        should: 'create story with name',
        actual: story.name,
        expected: 'User login'
      });

      assert({
        given: 'name and description',
        should: 'create story with description',
        actual: story.description,
        expected: 'As a user, I want to log in, so that I can access my account'
      });

      assert({
        given: 'name and description',
        should: 'generate unique ID',
        actual: typeof story.id,
        expected: 'string'
      });

      assert({
        given: 'name and description',
        should: 'have ID with length > 10',
        actual: story.id.length > 10,
        expected: true
      });
    }
  });


  test('story with priority and points', async () => {
    {
      const story = createStory({
        name: 'Dashboard view',
        description: 'As a user, I want to see my dashboard',
        priority: 'high',
        points: 5
      });

      assert({
        given: 'priority set to high',
        should: 'have high priority',
        actual: story.priority,
        expected: 'high'
      });

      assert({
        given: 'points set to 5',
        should: 'have 5 story points',
        actual: story.points,
        expected: 5
      });
    }
  });


  test('story with default values', async () => {
    {
      const story = createStory({ name: 'Test story' });

      assert({
        given: 'no description provided',
        should: 'default to empty string',
        actual: story.description,
        expected: ''
      });

      assert({
        given: 'no priority provided',
        should: 'default to medium',
        actual: story.priority,
        expected: 'medium'
      });

      assert({
        given: 'no points provided',
        should: 'default to 3',
        actual: story.points,
        expected: 3
      });

      assert({
        given: 'no status provided',
        should: 'default to backlog',
        actual: story.status,
        expected: 'backlog'
      });
    }
  });


  test('story with timestamps', async () => {
    {
      const before = Date.now();
      const story = createStory({ name: 'Test' });
      const after = Date.now();

      assert({
        given: 'story creation',
        should: 'have createdAt timestamp',
        actual: story.createdAt >= before && story.createdAt <= after,
        expected: true
      });

      assert({
        given: 'story creation',
        should: 'have updatedAt equal to createdAt',
        actual: story.updatedAt,
        expected: story.createdAt
      });
    }
  });
});


describe('createStep', () => {
  test('basic step creation', async () => {
    {
      const step = createStep({
        name: 'User Authentication',
        description: 'Steps for user to authenticate'
      });

      assert({
        given: 'name and description',
        should: 'create step with name',
        actual: step.name,
        expected: 'User Authentication'
      });

      assert({
        given: 'name and description',
        should: 'create step with description',
        actual: step.description,
        expected: 'Steps for user to authenticate'
      });

      assert({
        given: 'name and description',
        should: 'generate unique ID',
        actual: typeof step.id,
        expected: 'string'
      });

      assert({
        given: 'name and description',
        should: 'initialize empty stories array',
        actual: Array.isArray(step.stories) && step.stories.length === 0,
        expected: true
      });
    }
  });


  test('step with default values', async () => {
    {
      const step = createStep({ name: 'Test step' });

      assert({
        given: 'no description provided',
        should: 'default to empty string',
        actual: step.description,
        expected: ''
      });

      assert({
        given: 'no stories provided',
        should: 'default to empty array',
        actual: step.stories.length,
        expected: 0
      });
    }
  });
});


describe('createJourney', () => {
  test('basic journey creation', async () => {
    {
      const journey = createJourney({
        name: 'User Onboarding',
        description: 'Journey for new user onboarding'
      });

      assert({
        given: 'name and description',
        should: 'create journey with name',
        actual: journey.name,
        expected: 'User Onboarding'
      });

      assert({
        given: 'name and description',
        should: 'create journey with description',
        actual: journey.description,
        expected: 'Journey for new user onboarding'
      });

      assert({
        given: 'name and description',
        should: 'generate unique ID',
        actual: typeof journey.id,
        expected: 'string'
      });

      assert({
        given: 'name and description',
        should: 'initialize empty steps array',
        actual: Array.isArray(journey.steps) && journey.steps.length === 0,
        expected: true
      });
    }
  });


  test('journey with default values', async () => {
    {
      const journey = createJourney({ name: 'Test journey' });

      assert({
        given: 'no description provided',
        should: 'default to empty string',
        actual: journey.description,
        expected: ''
      });

      assert({
        given: 'no steps provided',
        should: 'default to empty array',
        actual: journey.steps.length,
        expected: 0
      });
    }
  });
});
