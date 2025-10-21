import { describe, test } from 'vitest';
import { assert } from 'riteway/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepColumn } from './StepColumn.jsx';
import { createStep, createStory } from '../data-model/entities.js';

describe('StepColumn', () => {
  test('displays step name in header', async () => {
    const step = createStep({ name: 'User Authentication' });

    render(<StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />);

    assert({
      given: 'a step with name "User Authentication"',
      should: 'display step name in header',
      actual: screen.getByText('User Authentication') !== null,
      expected: true,
    });
  });

  test('displays story count badge', async () => {
    const step = createStep({
      name: 'Authentication',
      stories: [
        createStory({ name: 'Login' }),
        createStory({ name: 'Logout' }),
        createStory({ name: 'Reset password' }),
      ],
    });

    render(<StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />);

    assert({
      given: 'a step with 3 stories',
      should: 'display "3" in story count badge',
      actual: screen.getByText('3') !== null,
      expected: true,
    });
  });

  test('displays zero count for empty step', async () => {
    const step = createStep({ name: 'Empty Step', stories: [] });

    render(<StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />);

    assert({
      given: 'a step with no stories',
      should: 'display "0" in story count badge',
      actual: screen.getByText('0') !== null,
      expected: true,
    });
  });

  test('renders all stories in step', async () => {
    const step = createStep({
      name: 'Auth Step',
      stories: [
        createStory({ name: 'Story One' }),
        createStory({ name: 'Story Two' }),
      ],
    });

    render(<StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />);

    assert({
      given: 'a step with 2 stories',
      should: 'render first story name',
      actual: screen.getByText('Story One') !== null,
      expected: true,
    });

    assert({
      given: 'a step with 2 stories',
      should: 'render second story name',
      actual: screen.getByText('Story Two') !== null,
      expected: true,
    });
  });

  test('calls onEditStep when header is clicked', async () => {
    const user = userEvent.setup();
    const step = createStep({ name: 'Test Step' });
    let editedStep = null;
    const handleEditStep = (s) => {
      editedStep = s;
    };

    render(<StepColumn step={step} onEditStep={handleEditStep} onEditStory={() => {}} />);

    const header = screen.getByRole('button', { name: /Test Step/i });
    await user.click(header);

    assert({
      given: 'step header is clicked',
      should: 'call onEditStep with step data',
      actual: editedStep?.name,
      expected: 'Test Step',
    });
  });

  test('passes onEditStory to story cards', async () => {
    const user = userEvent.setup();
    const step = createStep({
      name: 'Step',
      stories: [createStory({ name: 'Clickable Story' })],
    });
    let editedStory = null;
    const handleEditStory = (story) => {
      editedStory = story;
    };

    render(<StepColumn step={step} onEditStep={() => {}} onEditStory={handleEditStory} />);

    const storyCard = screen.getByText('Clickable Story');
    await user.click(storyCard);

    assert({
      given: 'story card is clicked',
      should: 'call onEditStory with story data',
      actual: editedStory?.name,
      expected: 'Clickable Story',
    });
  });

  test('has step-column class for styling', async () => {
    const step = createStep({ name: 'Test' });

    const { container } = render(
      <StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />,
    );

    const stepColumn = container.querySelector('.step-column');

    assert({
      given: 'rendered step column',
      should: 'have step-column class',
      actual: stepColumn !== null,
      expected: true,
    });
  });

  test('has glass-surface class on header', async () => {
    const step = createStep({ name: 'Test' });

    const { container } = render(
      <StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />,
    );

    const header = container.querySelector('.step-header');

    assert({
      given: 'rendered step header',
      should: 'have glass-surface class for glassmorphism',
      actual: header?.className.includes('glass-surface'),
      expected: true,
    });
  });

  test('renders stories container even when empty', async () => {
    const step = createStep({ name: 'Empty', stories: [] });

    const { container } = render(
      <StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />,
    );

    const storiesContainer = container.querySelector('.step-stories');

    assert({
      given: 'step with no stories',
      should: 'still render stories container',
      actual: storiesContainer !== null,
      expected: true,
    });
  });

  test('header has editable class when onEditStep provided', async () => {
    const step = createStep({ name: 'Test' });

    const { container } = render(
      <StepColumn step={step} onEditStep={() => {}} onEditStory={() => {}} />,
    );

    const header = container.querySelector('.step-header');

    assert({
      given: 'onEditStep callback provided',
      should: 'have editable class on header',
      actual: header?.className.includes('editable'),
      expected: true,
    });
  });
});
