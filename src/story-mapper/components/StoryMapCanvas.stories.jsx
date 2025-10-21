import { StoryMapCanvas } from './StoryMapCanvas.jsx';
import { createJourney, createStep, createStory } from '../data-model/entities.js';
import './StoryMapCanvas.css';
import './JourneyRow.css';
import './StepColumn.css';
import './StoryCard.css';
import './EditModal.css';

export default {
  title: 'Story Mapper/StoryMapCanvas',
  component: StoryMapCanvas,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

/**
 * Empty canvas with no journeys
 */
export const Empty = {
  args: {
    initialData: {
      journeys: [],
    },
  },
};

/**
 * Simple canvas with one journey
 */
export const SingleJourney = {
  args: {
    initialData: {
      journeys: [
        createJourney({
          name: 'User Onboarding',
          description: 'New user onboarding flow',
          steps: [
            createStep({
              name: 'Account Setup',
              description: 'Create and configure account',
              stories: [
                createStory({
                  name: 'Sign up',
                  description: 'As a new user, I want to create an account',
                  priority: 'high',
                  points: 5,
                }),
                createStory({
                  name: 'Email verification',
                  description: 'As a new user, I want to verify my email',
                  priority: 'high',
                  points: 3,
                }),
              ],
            }),
            createStep({
              name: 'Profile Completion',
              description: 'Complete user profile',
              stories: [
                createStory({
                  name: 'Add profile photo',
                  description: 'As a user, I want to upload a profile picture',
                  priority: 'medium',
                  points: 3,
                }),
              ],
            }),
          ],
        }),
      ],
    },
  },
};

/**
 * Full story map demonstrating the Story Mapper tool itself
 */
export const StoryMapperTool = {
  args: {
    initialData: {
      journeys: [
        createJourney({
          name: 'Story Mapping',
          description: 'Create and manage user story maps',
          steps: [
            createStep({
              name: 'Create Map',
              stories: [
                createStory({
                  name: 'Create new story map',
                  description: 'As a PM, I want to create a new story map',
                  priority: 'high',
                  points: 8,
                }),
                createStory({
                  name: 'Import existing stories',
                  description: 'As a PM, I want to import stories from Jira',
                  priority: 'medium',
                  points: 13,
                }),
              ],
            }),
            createStep({
              name: 'Organize Stories',
              stories: [
                createStory({
                  name: 'Add journey',
                  description: 'As a PM, I want to add journeys to organize work',
                  priority: 'high',
                  points: 5,
                }),
                createStory({
                  name: 'Add steps',
                  description: 'As a PM, I want to add steps within journeys',
                  priority: 'high',
                  points: 5,
                }),
                createStory({
                  name: 'Add stories',
                  description: 'As a PM, I want to add user stories to steps',
                  priority: 'high',
                  points: 5,
                }),
              ],
            }),
            createStep({
              name: 'Edit & Refine',
              stories: [
                createStory({
                  name: 'Edit any element',
                  description: 'As a PM, I want to click to edit journeys/steps/stories',
                  priority: 'high',
                  points: 8,
                }),
                createStory({
                  name: 'Set priorities',
                  description: 'As a PM, I want to set story priorities',
                  priority: 'medium',
                  points: 3,
                }),
                createStory({
                  name: 'Estimate points',
                  description: 'As a PM, I want to estimate story points',
                  priority: 'medium',
                  points: 3,
                }),
              ],
            }),
          ],
        }),
        createJourney({
          name: 'AI Assistance',
          description: 'GenAI-powered story generation',
          steps: [
            createStep({
              name: 'Generate Stories',
              stories: [
                createStory({
                  name: 'Ask AI for ideas',
                  description: 'As a PM, I want AI to suggest user stories',
                  priority: 'high',
                  points: 13,
                }),
                createStory({
                  name: 'Refine with AI',
                  description: 'As a PM, I want to refine stories using natural language',
                  priority: 'high',
                  points: 8,
                }),
              ],
            }),
            createStep({
              name: 'Review & Adjust',
              stories: [
                createStory({
                  name: 'Accept AI suggestions',
                  description: 'As a PM, I want to accept/reject AI suggestions',
                  priority: 'medium',
                  points: 5,
                }),
              ],
            }),
          ],
        }),
      ],
    },
  },
};

/**
 * Complex story map with multiple journeys
 */
export const EcommerceApp = {
  args: {
    initialData: {
      journeys: [
        createJourney({
          name: 'Shopping Experience',
          steps: [
            createStep({
              name: 'Browse',
              stories: [
                createStory({ name: 'View products', priority: 'high', points: 8 }),
                createStory({ name: 'Search products', priority: 'high', points: 8 }),
                createStory({ name: 'Filter by category', priority: 'medium', points: 5 }),
              ],
            }),
            createStep({
              name: 'Cart',
              stories: [
                createStory({ name: 'Add to cart', priority: 'high', points: 5 }),
                createStory({ name: 'Update quantity', priority: 'medium', points: 3 }),
                createStory({ name: 'Remove items', priority: 'medium', points: 2 }),
              ],
            }),
            createStep({
              name: 'Checkout',
              stories: [
                createStory({ name: 'Enter shipping', priority: 'high', points: 5 }),
                createStory({ name: 'Choose payment', priority: 'high', points: 8 }),
                createStory({ name: 'Complete order', priority: 'high', points: 13 }),
              ],
            }),
          ],
        }),
        createJourney({
          name: 'Account Management',
          steps: [
            createStep({
              name: 'Profile',
              stories: [
                createStory({ name: 'View profile', priority: 'high', points: 3 }),
                createStory({ name: 'Edit profile', priority: 'medium', points: 5 }),
              ],
            }),
            createStep({
              name: 'Orders',
              stories: [
                createStory({ name: 'View order history', priority: 'high', points: 8 }),
                createStory({ name: 'Track shipment', priority: 'medium', points: 8 }),
                createStory({ name: 'Return items', priority: 'low', points: 13 }),
              ],
            }),
          ],
        }),
        createJourney({
          name: 'Seller Features',
          steps: [
            createStep({
              name: 'Product Management',
              stories: [
                createStory({ name: 'Add products', priority: 'high', points: 8 }),
                createStory({ name: 'Manage inventory', priority: 'high', points: 13 }),
              ],
            }),
            createStep({
              name: 'Analytics',
              stories: [
                createStory({ name: 'View sales', priority: 'medium', points: 8 }),
                createStory({ name: 'Export reports', priority: 'low', points: 5 }),
              ],
            }),
          ],
        }),
      ],
    },
  },
};
