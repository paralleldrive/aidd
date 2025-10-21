import { StepColumn } from './StepColumn.jsx';
import './JourneyRow.css';

/**
 * JourneyRow - Row component that displays a journey and its steps
 * @param {Object} journey - Journey entity with name, steps array
 * @param {string} variant - Visual variant ('cyan' or 'magenta') for neon border
 * @param {Function} onEditJourney - Callback when journey header is clicked
 * @param {Function} onEditStep - Callback when step is clicked
 * @param {Function} onEditStory - Callback when story is clicked
 */
export const JourneyRow = ({
  journey,
  variant = 'cyan',
  onEditJourney,
  onEditStep,
  onEditStory,
}) => {
  const { name, steps = [] } = journey;

  const handleJourneyClick = () => {
    if (onEditJourney) {
      onEditJourney(journey);
    }
  };

  return (
    <div className={`journey-row neon-border-${variant}`}>
      <div
        className={`journey-header glass-surface${onEditJourney ? ' editable' : ''}`}
        onClick={handleJourneyClick}
        role={onEditJourney ? 'button' : undefined}
        tabIndex={onEditJourney ? 0 : undefined}
        aria-label={`${name}, ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`}
      >
        <h2 className="journey-name">{name}</h2>
      </div>
      <div className="journey-steps">
        {steps.map((step) => (
          <StepColumn
            key={step.id}
            step={step}
            onEditStep={onEditStep}
            onEditStory={onEditStory}
          />
        ))}
      </div>
    </div>
  );
};
