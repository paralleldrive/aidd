import { describe, test } from 'vitest';
import { assert } from 'riteway/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JourneyRow } from './JourneyRow.jsx';
import { createJourney, createStep, createStory } from '../data-model/entities.js';

describe('JourneyRow', () => {
  test('displays journey name in header', async () => {
    const journey = createJourney({ name: 'User Onboarding' });

    render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    assert({
      given: 'a journey with name "User Onboarding"',
      should: 'display journey name in header',
      actual: screen.getByText('User Onboarding') !== null,
      expected: true,
    });
  });

  test('applies cyan neon border variant', async () => {
    const journey = createJourney({ name: 'Test Journey' });

    const { container } = render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    const journeyRow = container.querySelector('.journey-row');

    assert({
      given: 'variant="cyan"',
      should: 'apply neon-border-cyan class',
      actual: journeyRow?.className.includes('neon-border-cyan'),
      expected: true,
    });
  });

  test('applies magenta neon border variant', async () => {
    const journey = createJourney({ name: 'Test Journey' });

    const { container } = render(
      <JourneyRow
        journey={journey}
        variant="magenta"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    const journeyRow = container.querySelector('.journey-row');

    assert({
      given: 'variant="magenta"',
      should: 'apply neon-border-magenta class',
      actual: journeyRow?.className.includes('neon-border-magenta'),
      expected: true,
    });
  });

  test('renders all steps in journey', async () => {
    const journey = createJourney({
      name: 'Journey',
      steps: [
        createStep({ name: 'Step One' }),
        createStep({ name: 'Step Two' }),
        createStep({ name: 'Step Three' }),
      ],
    });

    render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    assert({
      given: 'a journey with 3 steps',
      should: 'render first step name',
      actual: screen.getByText('Step One') !== null,
      expected: true,
    });

    assert({
      given: 'a journey with 3 steps',
      should: 'render second step name',
      actual: screen.getByText('Step Two') !== null,
      expected: true,
    });

    assert({
      given: 'a journey with 3 steps',
      should: 'render third step name',
      actual: screen.getByText('Step Three') !== null,
      expected: true,
    });
  });

  test('calls onEditJourney when header is clicked', async () => {
    const user = userEvent.setup();
    const journey = createJourney({ name: 'Clickable Journey' });
    let editedJourney = null;
    const handleEditJourney = (j) => {
      editedJourney = j;
    };

    render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={handleEditJourney}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    const header = screen.getByRole('button', { name: /Clickable Journey/i });
    await user.click(header);

    assert({
      given: 'journey header is clicked',
      should: 'call onEditJourney with journey data',
      actual: editedJourney?.name,
      expected: 'Clickable Journey',
    });
  });

  test('passes onEditStep to step columns', async () => {
    const user = userEvent.setup();
    const journey = createJourney({
      name: 'Journey',
      steps: [createStep({ name: 'Clickable Step' })],
    });
    let editedStep = null;
    const handleEditStep = (step) => {
      editedStep = step;
    };

    render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={handleEditStep}
        onEditStory={() => {}}
      />,
    );

    const stepHeader = screen.getByRole('button', { name: /Clickable Step/i });
    await user.click(stepHeader);

    assert({
      given: 'step header is clicked',
      should: 'call onEditStep with step data',
      actual: editedStep?.name,
      expected: 'Clickable Step',
    });
  });

  test('passes onEditStory to story cards', async () => {
    const user = userEvent.setup();
    const journey = createJourney({
      name: 'Journey',
      steps: [
        createStep({
          name: 'Step',
          stories: [createStory({ name: 'Clickable Story' })],
        }),
      ],
    });
    let editedStory = null;
    const handleEditStory = (story) => {
      editedStory = story;
    };

    render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={handleEditStory}
      />,
    );

    const storyCard = screen.getByText('Clickable Story');
    await user.click(storyCard);

    assert({
      given: 'story card is clicked',
      should: 'call onEditStory with story data',
      actual: editedStory?.name,
      expected: 'Clickable Story',
    });
  });

  test('header has editable class when onEditJourney provided', async () => {
    const journey = createJourney({ name: 'Test' });

    const { container } = render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    const header = container.querySelector('.journey-header');

    assert({
      given: 'onEditJourney callback provided',
      should: 'have editable class on header',
      actual: header?.className.includes('editable'),
      expected: true,
    });
  });

  test('renders steps container with proper class', async () => {
    const journey = createJourney({
      name: 'Test',
      steps: [createStep({ name: 'Step' })],
    });

    const { container } = render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    const stepsContainer = container.querySelector('.journey-steps');

    assert({
      given: 'journey with steps',
      should: 'render journey-steps container',
      actual: stepsContainer !== null,
      expected: true,
    });
  });

  test('renders empty journey without steps', async () => {
    const journey = createJourney({ name: 'Empty Journey', steps: [] });

    const { container } = render(
      <JourneyRow
        journey={journey}
        variant="cyan"
        onEditJourney={() => {}}
        onEditStep={() => {}}
        onEditStory={() => {}}
      />,
    );

    const stepsContainer = container.querySelector('.journey-steps');

    assert({
      given: 'journey with no steps',
      should: 'still render steps container',
      actual: stepsContainer !== null,
      expected: true,
    });
  });
});
