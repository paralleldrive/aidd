import { StoryCard } from './StoryCard.jsx';
import './StepColumn.css';

/**
 * StepColumn - Column component that displays a step and its stories
 * @param {Object} step - Step entity with name, stories array
 * @param {Function} onEditStep - Callback when step header is clicked
 * @param {Function} onEditStory - Callback when story card is clicked
 */
export const StepColumn = ({ step, onEditStep, onEditStory }) => {
  const { name, stories = [] } = step;

  const handleStepClick = () => {
    if (onEditStep) {
      onEditStep(step);
    }
  };

  return (
    <div className="step-column">
      <div
        className={`step-header glass-surface${onEditStep ? ' editable' : ''}`}
        onClick={handleStepClick}
        role={onEditStep ? 'button' : undefined}
        tabIndex={onEditStep ? 0 : undefined}
        aria-label={`${name}, ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
      >
        <h3 className="step-name">{name}</h3>
        <span className="story-count-badge">{stories.length}</span>
      </div>
      <div className="step-stories">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} onEdit={onEditStory} />
        ))}
      </div>
    </div>
  );
};
