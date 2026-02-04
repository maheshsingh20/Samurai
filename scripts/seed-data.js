import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Dynamic user data
const users = [
  { id: 'user_1', name: 'Alice Johnson', avatar: '👩‍💼' },
  { id: 'user_2', name: 'Bob Smith', avatar: '👨‍💻' },
  { id: 'user_3', name: 'Carol Davis', avatar: '👩‍🎨' },
  { id: 'user_4', name: 'David Wilson', avatar: '👨‍🔬' },
  { id: 'user_5', name: 'Eva Brown', avatar: '👩‍🚀' },
  { id: 'user_6', name: 'Frank Miller', avatar: '👨‍🎭' },
  { id: 'user_7', name: 'Grace Lee', avatar: '👩‍⚕️' },
  { id: 'user_8', name: 'Henry Taylor', avatar: '👨‍🏫' },
  { id: 'user_9', name: 'Ivy Chen', avatar: '👩‍🔬' },
  { id: 'user_10', name: 'Jack Anderson', avatar: '👨‍🎨' }
];

// Dynamic content data
const contentTypes = {
  post: {
    titles: [
      'Amazing sunset at the beach',
      'My thoughts on remote work',
      'Weekend hiking adventure',
      'New recipe I tried today',
      'Book recommendation: The Pragmatic Programmer',
      'Coffee shop discoveries',
      'Travel memories from Japan',
      'Learning React hooks',
      'Morning workout routine',
      'Photography tips for beginners'
    ]
  },
  photo: {
    titles: [
      'Street art in downtown',
      'Family vacation memories',
      'Nature photography collection',
      'Food photography experiment',
      'Architecture shots',
      'Pet photos compilation',
      'Concert night captures',
      'Sunrise from my window',
      'Garden flowers blooming',
      'City skyline at night'
    ]
  },
  video: {
    titles: [
      'Tutorial: How to make pasta',
      'Time-lapse of city traffic',
      'Dance performance at local theater',
      'Product review: New smartphone',
      'Travel vlog: Weekend getaway',
      'Coding session: Building an API',
      'Workout routine for beginners',
      'Pet tricks compilation',
      'Music cover performance',
      'DIY home improvement project'
    ]
  },
  article: {
    titles: [
      'The Future of Web Development',
      'Climate Change and Technology',
      'Remote Work Best Practices',
      'Artificial Intelligence Ethics',
      'Sustainable Living Tips',
      'Mental Health in Tech Industry',
      'Cryptocurrency Market Analysis',
      'Space Exploration Updates',
      'Healthy Eating on a Budget',
      'Digital Privacy in 2024'
    ]
  },
  product: {
    titles: [
      'Wireless Noise-Canceling Headphones',
      'Ergonomic Standing Desk',
      'Smart Home Security Camera',
      'Organic Coffee Beans',
      'Fitness Tracking Smartwatch',
      'Portable Bluetooth Speaker',
      'Electric Bike for Commuting',
      'Professional Camera Lens',
      'Sustainable Water Bottle',
      'Gaming Mechanical Keyboard'
    ]
  },
  project: {
    titles: [
      'Open Source React Component Library',
      'Community Garden Initiative',
      'Mobile App for Local Businesses',
      'Environmental Data Visualization',
      'Online Learning Platform',
      'Charity Fundraising Website',
      'Smart City IoT Solution',
      'Mental Health Support App',
      'Sustainable Fashion Marketplace',
      'AI-Powered Code Review Tool'
    ]
  }
};

const verbs = ['like', 'comment', 'share', 'follow', 'purchase', 'create', 'update', 'view', 'bookmark', 'subscribe'];

// Generate realistic event
function generateRealisticEvent() {
  const actor = users[Math.floor(Math.random() * users.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const objectTypes = Object.keys(contentTypes);
  const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
  const titles = contentTypes[objectType].titles;
  const objectTitle = titles[Math.floor(Math.random() * titles.length)];

  // Generate target users (followers/interested users)
  const targetUsers = users
    .filter(u => u.id !== actor.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 4) + 1)
    .map(u => u.id);

  return {
    actor_id: actor.id,
    actor_name: actor.name,
    verb,
    object_type: objectType,
    object_id: `${objectType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    object_title: objectTitle,
    target_user_ids: targetUsers,
    created_at: new Date().toISOString()
  };
}

// Create event via API
async function createEvent(event) {
  try {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user_id': event.actor_id
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

// Seed initial data
async function seedInitialData(count = 50) {
  console.log(`Seeding ${count} initial events...`);

  for (let i = 0; i < count; i++) {
    const event = generateRealisticEvent();
    const result = await createEvent(event);

    if (result) {
      console.log(`✓ Created event ${i + 1}/${count}: ${event.actor_name} ${event.verb} ${event.object_type}`);
    } else {
      console.log(`✗ Failed to create event ${i + 1}/${count}`);
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Initial seeding complete!');
}

// Continuous event generation
async function startContinuousGeneration(intervalMs = 5000) {
  console.log(`Starting continuous event generation (every ${intervalMs}ms)...`);

  setInterval(async () => {
    const event = generateRealisticEvent();
    const result = await createEvent(event);

    if (result) {
      console.log(`🔄 Generated: ${event.actor_name} ${event.verb} ${event.object_type} "${event.object_title}"`);
    }
  }, intervalMs);
}

// Burst generation for testing
async function generateBurst(count = 10, delayMs = 500) {
  console.log(`Generating burst of ${count} events...`);

  for (let i = 0; i < count; i++) {
    const event = generateRealisticEvent();
    const result = await createEvent(event);

    if (result) {
      console.log(`💥 Burst ${i + 1}/${count}: ${event.actor_name} ${event.verb} ${event.object_type}`);
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';

  switch (command) {
    case 'seed':
      const count = parseInt(args[1]) || 50;
      await seedInitialData(count);
      break;

    case 'continuous':
      const interval = parseInt(args[1]) || 5000;
      await seedInitialData(20); // Seed some initial data first
      await startContinuousGeneration(interval);
      break;

    case 'burst':
      const burstCount = parseInt(args[1]) || 10;
      const burstDelay = parseInt(args[2]) || 500;
      await generateBurst(burstCount, burstDelay);
      break;

    default:
      console.log('Usage:');
      console.log('  node seed-data.js seed [count]           - Seed initial data');
      console.log('  node seed-data.js continuous [interval]  - Continuous generation');
      console.log('  node seed-data.js burst [count] [delay]  - Generate burst');
  }
}

// Export for use in other scripts
export { users, contentTypes, generateRealisticEvent, createEvent };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}