import { describe, test } from 'vitest';
import { assert } from 'riteway/vitest';
import { render, screen } from '@testing-library/react';
import { StoryCard } from './StoryCard.jsx';
import { createStory } from '../data-model/entities.js';

describe('StoryCard', () => {
  test('displays story name', async () => {
    const story = createStory({
      name: 'User login',
      description: 'As a user, I want to log in',
    });

    render(<StoryCard story={story} />);

    assert({
      given: 'a story with name "User login"',
      should: 'display the story name',
      actual: screen.getByText('User login') !== null,
      expected: true,
    });
  });

  test('displays story description', async () => {
    const story = createStory({
      name: 'User login',
      description: 'As a user, I want to log in, so that I can access my account',
    });

    render(<StoryCard story={story} />);

    assert({
      given: 'a story with description',
      should: 'display the description text',
      actual:
        screen.getByText(
          'As a user, I want to log in, so that I can access my account',
        ) !== null,
      expected: true,
    });
  });

  test('displays story ID', async () => {
    const story = createStory({
      id: 'story-123',
      name: 'Test story',
    });

    render(<StoryCard story={story} />);

    assert({
      given: 'a story with ID "story-123"',
      should: 'display the story ID',
      actual: screen.getByText('story-123') !== null,
      expected: true,
    });
  });

  test('displays high priority with correct styling', async () => {
    const story = createStory({
      name: 'Critical bug',
      priority: 'high',
    });

    render(<StoryCard story={story} />);
    const priorityElement = screen.getByText('High');

    assert({
      given: 'a story with high priority',
      should: 'display "High" text',
      actual: priorityElement !== null,
      expected: true,
    });

    assert({
      given: 'a story with high priority',
      should: 'have priority-high class',
      actual: priorityElement.className.includes('priority-high'),
      expected: true,
    });
  });

  test('displays medium priority', async () => {
    const story = createStory({
      name: 'Feature request',
      priority: 'medium',
    });

    render(<StoryCard story={story} />);
    const priorityElement = screen.getByText('Medium');

    assert({
      given: 'a story with medium priority',
      should: 'display "Medium" text',
      actual: priorityElement !== null,
      expected: true,
    });

    assert({
      given: 'a story with medium priority',
      should: 'have priority-medium class',
      actual: priorityElement.className.includes('priority-medium'),
      expected: true,
    });
  });

  test('displays low priority', async () => {
    const story = createStory({
      name: 'Nice to have',
      priority: 'low',
    });

    render(<StoryCard story={story} />);
    const priorityElement = screen.getByText('Low');

    assert({
      given: 'a story with low priority',
      should: 'display "Low" text',
      actual: priorityElement !== null,
      expected: true,
    });

    assert({
      given: 'a story with low priority',
      should: 'have priority-low class',
      actual: priorityElement.className.includes('priority-low'),
      expected: true,
    });
  });

  test('displays story points', async () => {
    const story = createStory({
      name: 'Test story',
      points: 8,
    });

    render(<StoryCard story={story} />);

    assert({
      given: 'a story with 8 points',
      should: 'display "8 pts"',
      actual: screen.getByText('8 pts') !== null,
      expected: true,
    });
  });

  test('applies glass-surface class', async () => {
    const story = createStory({ name: 'Test' });

    const { container } = render(<StoryCard story={story} />);
    const card = container.firstChild;

    assert({
      given: 'a rendered story card',
      should: 'have glass-surface class for glassmorphism',
      actual: card.className.includes('glass-surface'),
      expected: true,
    });
  });

  test('applies story-card class', async () => {
    const story = createStory({ name: 'Test' });

    const { container } = render(<StoryCard story={story} />);
    const card = container.firstChild;

    assert({
      given: 'a rendered story card',
      should: 'have story-card class',
      actual: card.className.includes('story-card'),
      expected: true,
    });
  });

  test('calls onEdit with story when clicked', async () => {
    const story = createStory({ name: 'Test story' });
    let editedStory = null;
    const handleEdit = (s) => {
      editedStory = s;
    };

    const { container } = render(
      <StoryCard story={story} onEdit={handleEdit} />,
    );
    const card = container.firstChild;

    card.click();

    assert({
      given: 'a card with onEdit callback that is clicked',
      should: 'call onEdit with the story',
      actual: editedStory === story,
      expected: true,
    });
  });

  test('has editable class when onEdit provided', async () => {
    const story = createStory({ name: 'Test' });
    const handleEdit = () => {};

    const { container } = render(
      <StoryCard story={story} onEdit={handleEdit} />,
    );
    const card = container.firstChild;

    assert({
      given: 'a story card with onEdit callback',
      should: 'have editable class',
      actual: card.className.includes('editable'),
      expected: true,
    });
  });

  test('does not have editable class when no onEdit', async () => {
    const story = createStory({ name: 'Test' });

    const { container } = render(<StoryCard story={story} />);
    const card = container.firstChild;

    assert({
      given: 'a story card without onEdit callback',
      should: 'not have editable class',
      actual: card.className.includes('editable'),
      expected: false,
    });
  });
});
