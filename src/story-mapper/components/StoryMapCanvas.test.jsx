import { describe, test } from 'vitest';
import { assert } from 'riteway/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryMapCanvas } from './StoryMapCanvas.jsx';
import { createJourney, createStep, createStory } from '../data-model/entities.js';

describe('StoryMapCanvas', () => {
  test('renders all journeys in vertical stack', async () => {
    const initialData = {
      journeys: [
        createJourney({ name: 'Journey One' }),
        createJourney({ name: 'Journey Two' }),
        createJourney({ name: 'Journey Three' }),
      ],
    };

    render(<StoryMapCanvas initialData={initialData} />);

    assert({
      given: 'canvas with 3 journeys',
      should: 'render first journey name',
      actual: screen.getByText('Journey One') !== null,
      expected: true,
    });

    assert({
      given: 'canvas with 3 journeys',
      should: 'render second journey name',
      actual: screen.getByText('Journey Two') !== null,
      expected: true,
    });

    assert({
      given: 'canvas with 3 journeys',
      should: 'render third journey name',
      actual: screen.getByText('Journey Three') !== null,
      expected: true,
    });
  });

  test('alternates neon border colors for journeys', async () => {
    const initialData = {
      journeys: [
        createJourney({ name: 'First' }),
        createJourney({ name: 'Second' }),
      ],
    };

    const { container } = render(<StoryMapCanvas initialData={initialData} />);

    const journeys = container.querySelectorAll('.journey-row');

    assert({
      given: '2 journeys',
      should: 'apply cyan border to first journey',
      actual: journeys[0]?.className.includes('neon-border-cyan'),
      expected: true,
    });

    assert({
      given: '2 journeys',
      should: 'apply magenta border to second journey',
      actual: journeys[1]?.className.includes('neon-border-magenta'),
      expected: true,
    });
  });

  test('renders nested steps and stories', async () => {
    const initialData = {
      journeys: [
        createJourney({
          name: 'Test Journey',
          steps: [
            createStep({
              name: 'Test Step',
              stories: [createStory({ name: 'Test Story' })],
            }),
          ],
        }),
      ],
    };

    render(<StoryMapCanvas initialData={initialData} />);

    assert({
      given: 'journey with nested step and story',
      should: 'render story name',
      actual: screen.getByText('Test Story') !== null,
      expected: true,
    });

    assert({
      given: 'journey with nested step',
      should: 'render step name',
      actual: screen.getByText('Test Step') !== null,
      expected: true,
    });
  });

  test('renders empty canvas with no journeys', async () => {
    const initialData = { journeys: [] };

    const { container } = render(<StoryMapCanvas initialData={initialData} />);

    const canvas = container.querySelector('.story-map-canvas');

    assert({
      given: 'empty canvas data',
      should: 'render canvas container',
      actual: canvas !== null,
      expected: true,
    });
  });

  test('opens edit modal when journey is clicked', async () => {
    const user = userEvent.setup();
    const initialData = {
      journeys: [createJourney({ name: 'Clickable Journey' })],
    };

    render(<StoryMapCanvas initialData={initialData} />);

    const journeyHeader = screen.getByRole('button', { name: /Clickable Journey/i });
    await user.click(journeyHeader);

    // Modal should open with journey name in title
    const modalTitle = screen.queryByText(/Edit Journey/i);

    assert({
      given: 'journey header clicked',
      should: 'open edit modal',
      actual: modalTitle !== null,
      expected: true,
    });
  });

  test('opens edit modal when step is clicked', async () => {
    const user = userEvent.setup();
    const initialData = {
      journeys: [
        createJourney({
          name: 'Journey',
          steps: [createStep({ name: 'Clickable Step' })],
        }),
      ],
    };

    render(<StoryMapCanvas initialData={initialData} />);

    const stepHeader = screen.getByRole('button', { name: /Clickable Step/i });
    await user.click(stepHeader);

    const modalTitle = screen.queryByText(/Edit Step/i);

    assert({
      given: 'step header clicked',
      should: 'open edit modal with "Edit Step" title',
      actual: modalTitle !== null,
      expected: true,
    });
  });

  test('opens edit modal when story is clicked', async () => {
    const user = userEvent.setup();
    const initialData = {
      journeys: [
        createJourney({
          name: 'Journey',
          steps: [
            createStep({
              name: 'Step',
              stories: [createStory({ name: 'Clickable Story' })],
            }),
          ],
        }),
      ],
    };

    render(<StoryMapCanvas initialData={initialData} />);

    const storyCard = screen.getByText('Clickable Story');
    await user.click(storyCard);

    const modalTitle = screen.queryByText(/Edit Story/i);

    assert({
      given: 'story card clicked',
      should: 'open edit modal with "Edit Story" title',
      actual: modalTitle !== null,
      expected: true,
    });
  });

  test('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    const initialData = {
      journeys: [createJourney({ name: 'Test Journey' })],
    };

    render(<StoryMapCanvas initialData={initialData} />);

    // Open modal
    const journeyHeader = screen.getByRole('button', { name: /Test Journey/i });
    await user.click(journeyHeader);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    // Modal should be closed
    const modalTitle = screen.queryByText(/Edit Journey/i);

    assert({
      given: 'cancel button clicked',
      should: 'close modal',
      actual: modalTitle === null,
      expected: true,
    });
  });

  test('has story-map-canvas class for styling', async () => {
    const initialData = { journeys: [] };

    const { container } = render(<StoryMapCanvas initialData={initialData} />);

    const canvas = container.querySelector('.story-map-canvas');

    assert({
      given: 'rendered canvas',
      should: 'have story-map-canvas class',
      actual: canvas !== null,
      expected: true,
    });
  });

  test('renders journeys container', async () => {
    const initialData = { journeys: [] };

    const { container } = render(<StoryMapCanvas initialData={initialData} />);

    const journeysContainer = container.querySelector('.journeys-container');

    assert({
      given: 'rendered canvas',
      should: 'have journeys-container element',
      actual: journeysContainer !== null,
      expected: true,
    });
  });
});
