import { useState } from 'react';
import { JourneyRow } from './JourneyRow.jsx';
import { EditModal } from './EditModal.jsx';
import './StoryMapCanvas.css';

/**
 * StoryMapCanvas - Main canvas component that orchestrates the story map
 * @param {Object} initialData - Initial story map data with journeys array
 */
export const StoryMapCanvas = ({ initialData = { journeys: [] } }) => {
  const [storyMapData, setStoryMapData] = useState(initialData);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    entityType: null,
    entity: null,
  });

  const handleEditJourney = (journey) => {
    setEditModal({
      isOpen: true,
      entityType: 'journey',
      entity: journey,
    });
  };

  const handleEditStep = (step) => {
    setEditModal({
      isOpen: true,
      entityType: 'step',
      entity: step,
    });
  };

  const handleEditStory = (story) => {
    setEditModal({
      isOpen: true,
      entityType: 'story',
      entity: story,
    });
  };

  const handleCloseModal = () => {
    setEditModal({
      isOpen: false,
      entityType: null,
      entity: null,
    });
  };

  const handleSaveModal = (updatedData) => {
    // TODO: Implement state update logic
    // For now, just close the modal
    handleCloseModal();
  };

  const { journeys = [] } = storyMapData;

  return (
    <div className="story-map-canvas">
      <div className="journeys-container">
        {journeys.map((journey, index) => (
          <JourneyRow
            key={journey.id}
            journey={journey}
            variant={index % 2 === 0 ? 'cyan' : 'magenta'}
            onEditJourney={handleEditJourney}
            onEditStep={handleEditStep}
            onEditStory={handleEditStory}
          />
        ))}
      </div>

      <EditModal
        isOpen={editModal.isOpen}
        entityType={editModal.entityType}
        entity={editModal.entity}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
      />
    </div>
  );
};
