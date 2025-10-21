import { useState } from 'react';
import './EditModal.css';

/**
 * EditModal - Modal for editing journeys, steps, and stories
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} entityType - Type: 'journey' | 'step' | 'story'
 * @param {Object} entity - Entity to edit
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onSave - Callback with updated entity data
 */
export const EditModal = ({
  isOpen,
  entityType,
  entity,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: entity?.name || '',
    description: entity?.description || '',
    priority: entity?.priority || 'medium',
    points: entity?.points || 3,
  });

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handlePointsChange = (e) => {
    setFormData({
      ...formData,
      points: parseInt(e.target.value, 10),
    });
  };

  const titleText =
    entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Edit {titleText}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} id="editForm">
            <div className="form-group">
              <label htmlFor="editName">Name</label>
              <input
                type="text"
                id="editName"
                className="form-input glass-input"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="editDescription">Description</label>
              <textarea
                id="editDescription"
                className="form-textarea glass-input"
                rows="3"
                value={formData.description}
                onChange={handleChange('description')}
              />
            </div>

            {entityType === 'story' && (
              <div id="storyFields">
                <div className="form-group">
                  <label htmlFor="editPriority">Priority</label>
                  <select
                    id="editPriority"
                    className="form-select glass-input"
                    value={formData.priority}
                    onChange={handleChange('priority')}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editPoints">Story Points</label>
                  <input
                    type="number"
                    id="editPoints"
                    className="form-input glass-input"
                    min="1"
                    max="100"
                    value={formData.points}
                    onChange={handlePointsChange}
                  />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary glass-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary glass-button">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
