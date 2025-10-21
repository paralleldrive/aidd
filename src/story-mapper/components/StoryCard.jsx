import './StoryCard.css';

/**
 * StoryCard - Displays a user story with glassmorphism styling
 * @param {Object} story - Story object with id, name, description, priority, points
 * @param {Function} [onEdit] - Optional callback when card is clicked
 */
export const StoryCard = ({ story, onEdit }) => {
  const { id, name, description, priority, points } = story;

  const handleClick = () => {
    if (onEdit) {
      onEdit(story);
    }
  };

  const priorityText = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <div
      className={`story-card glass-surface${onEdit ? ' editable' : ''}`}
      onClick={handleClick}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
    >
      <div className="story-header">
        <span className="story-id">{id}</span>
      </div>
      <h4 className="story-title">{name}</h4>
      <p className="story-description">{description}</p>
      <div className="story-footer">
        <span className={`story-tag priority-${priority}`}>{priorityText}</span>
        <span className="story-points">{points} pts</span>
      </div>
    </div>
  );
};
