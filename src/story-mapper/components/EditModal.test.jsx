import { describe, test } from 'vitest';
import { assert } from 'riteway/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditModal } from './EditModal.jsx';
import { createStory, createStep, createJourney } from '../data-model/entities.js';

describe('EditModal', () => {
  test('displays modal title for story', async () => {
    const story = createStory({ name: 'Test story' });

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'a modal editing a story',
      should: 'display "Edit Story" title',
      actual: screen.getByText('Edit Story') !== null,
      expected: true,
    });
  });

  test('displays modal title for step', async () => {
    const step = createStep({ name: 'Test step' });

    render(
      <EditModal
        isOpen={true}
        entityType="step"
        entity={step}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'a modal editing a step',
      should: 'display "Edit Step" title',
      actual: screen.getByText('Edit Step') !== null,
      expected: true,
    });
  });

  test('displays modal title for journey', async () => {
    const journey = createJourney({ name: 'Test journey' });

    render(
      <EditModal
        isOpen={true}
        entityType="journey"
        entity={journey}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'a modal editing a journey',
      should: 'display "Edit Journey" title',
      actual: screen.getByText('Edit Journey') !== null,
      expected: true,
    });
  });

  test('populates name field with entity name', async () => {
    const story = createStory({ name: 'User login' });

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    const nameInput = screen.getByLabelText('Name');

    assert({
      given: 'a story with name "User login"',
      should: 'populate name input with value',
      actual: nameInput.value,
      expected: 'User login',
    });
  });

  test('populates description field with entity description', async () => {
    const story = createStory({
      name: 'Test',
      description: 'As a user, I want to test',
    });

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    const descInput = screen.getByLabelText('Description');

    assert({
      given: 'a story with description',
      should: 'populate description textarea with value',
      actual: descInput.value,
      expected: 'As a user, I want to test',
    });
  });

  test('shows priority field for story', async () => {
    const story = createStory({ name: 'Test', priority: 'high' });

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'a modal editing a story',
      should: 'show priority field',
      actual: screen.getByLabelText('Priority') !== null,
      expected: true,
    });
  });

  test('hides priority field for non-story entities', async () => {
    const step = createStep({ name: 'Test step' });

    render(
      <EditModal
        isOpen={true}
        entityType="step"
        entity={step}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'a modal editing a step',
      should: 'not show priority field',
      actual: screen.queryByLabelText('Priority') === null,
      expected: true,
    });
  });

  test('shows story points field for story', async () => {
    const story = createStory({ name: 'Test', points: 5 });

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    const pointsInput = screen.getByLabelText('Story Points');

    assert({
      given: 'a story with 5 points',
      should: 'populate points input with value',
      actual: pointsInput.value,
      expected: '5',
    });
  });

  test('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    const story = createStory({ name: 'Test' });
    let closeCalled = false;
    const handleClose = () => {
      closeCalled = true;
    };

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={handleClose}
        onSave={() => {}}
      />,
    );

    const cancelBtn = screen.getByText('Cancel');
    await user.click(cancelBtn);

    assert({
      given: 'cancel button is clicked',
      should: 'call onClose callback',
      actual: closeCalled,
      expected: true,
    });
  });

  test('calls onSave with updated data when form submitted', async () => {
    const user = userEvent.setup();
    const story = createStory({ name: 'Original name' });
    let savedData = null;
    const handleSave = (data) => {
      savedData = data;
    };

    render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={handleSave}
      />,
    );

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated name');

    const saveBtn = screen.getByText('Save Changes');
    await user.click(saveBtn);

    assert({
      given: 'form submitted with updated name',
      should: 'call onSave with updated name',
      actual: savedData?.name,
      expected: 'Updated name',
    });
  });

  test('does not render when isOpen is false', async () => {
    const story = createStory({ name: 'Test' });

    const { container } = render(
      <EditModal
        isOpen={false}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'isOpen is false',
      should: 'not render modal content',
      actual: container.querySelector('.modal-overlay') === null,
      expected: true,
    });
  });

  test('renders modal when isOpen is true', async () => {
    const story = createStory({ name: 'Test' });

    const { container } = render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    assert({
      given: 'isOpen is true',
      should: 'render modal overlay',
      actual: container.querySelector('.modal-overlay') !== null,
      expected: true,
    });
  });

  test('has glass-surface class on modal content', async () => {
    const story = createStory({ name: 'Test' });

    const { container } = render(
      <EditModal
        isOpen={true}
        entityType="story"
        entity={story}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    const modalContent = container.querySelector('.modal-content');

    assert({
      given: 'rendered modal',
      should: 'have glass-surface class for glassmorphism',
      actual: modalContent?.className.includes('glass-surface'),
      expected: true,
    });
  });
});
