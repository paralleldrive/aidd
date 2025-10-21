// Story Mapper - Interactive Edit Functionality

(function () {
  "use strict";

  // DOM elements
  const modal = document.getElementById("editModal");
  const modalTitle = document.getElementById("modalTitle");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelEdit");
  const editForm = document.getElementById("editForm");

  // Form fields
  const editType = document.getElementById("editType");
  const editId = document.getElementById("editId");
  const editName = document.getElementById("editName");
  const editDescription = document.getElementById("editDescription");
  const editPriority = document.getElementById("editPriority");
  const editPoints = document.getElementById("editPoints");
  const storyFields = document.getElementById("storyFields");

  let currentElement = null;

  // Initialize event listeners
  function init() {
    // Add click listeners to all editable elements
    document.querySelectorAll(".editable").forEach((element) => {
      element.addEventListener("click", handleEditClick);
    });

    // Modal close handlers
    closeModalBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Form submit handler
    editForm.addEventListener("submit", handleFormSubmit);

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none") {
        closeModal();
      }
    });
  }

  // Handle click on editable elements
  function handleEditClick(e) {
    e.stopPropagation();
    currentElement = e.currentTarget;

    const type = currentElement.dataset.type;
    const id = currentElement.dataset.id;
    const name = currentElement.dataset.name;
    const description = currentElement.dataset.description || "";

    // Set modal title based on type
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
    modalTitle.textContent = `Edit ${typeCapitalized}`;

    // Set form values
    editType.value = type;
    editId.value = id;
    editName.value = name;
    editDescription.value = description;

    // Show/hide story-specific fields
    if (type === "story") {
      const priority = currentElement.dataset.priority || "medium";
      const points = currentElement.dataset.points || "3";

      editPriority.value = priority;
      editPoints.value = points;
      storyFields.style.display = "block";
    } else {
      storyFields.style.display = "none";
    }

    openModal();
  }

  // Open modal
  function openModal() {
    modal.style.display = "flex";
    editName.focus();
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  // Close modal
  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = ""; // Re-enable scrolling
    currentElement = null;
    editForm.reset();
  }

  // Handle form submission
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentElement) return;

    const type = editType.value;
    const name = editName.value.trim();
    const description = editDescription.value.trim();

    // Update data attributes
    currentElement.dataset.name = name;
    currentElement.dataset.description = description;

    // Update visible content based on type
    if (type === "journey") {
      const titleElement = currentElement.querySelector(".journey-title");
      if (titleElement) titleElement.textContent = name;
    } else if (type === "step") {
      const titleElement = currentElement.querySelector(".step-title");
      if (titleElement) titleElement.textContent = name;
    } else if (type === "story") {
      const priority = editPriority.value;
      const points = editPoints.value;

      currentElement.dataset.priority = priority;
      currentElement.dataset.points = points;

      // Update story card content
      const titleElement = currentElement.querySelector(".story-title");
      const descElement = currentElement.querySelector(".story-description");
      const priorityTag = currentElement.querySelector(".story-tag");
      const pointsElement = currentElement.querySelector(".story-points");

      if (titleElement) titleElement.textContent = name;
      if (descElement) descElement.textContent = description;
      if (priorityTag) {
        priorityTag.textContent =
          priority.charAt(0).toUpperCase() + priority.slice(1);
        priorityTag.className = `story-tag priority-${priority}`;
      }
      if (pointsElement) pointsElement.textContent = `${points} pts`;
    }

    // Show success feedback
    showSuccessFeedback();

    closeModal();
  }

  // Show success feedback
  function showSuccessFeedback() {
    if (!currentElement) return;

    currentElement.classList.add("save-success");
    setTimeout(() => {
      currentElement.classList.remove("save-success");
    }, 1000);
  }

  // Initialize on DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
