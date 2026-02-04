import React, { useState, useEffect } from 'react';
import { Play, Pause, Zap, Settings } from 'lucide-react';
import { eventApi } from '../services/api';

interface AutoEventGeneratorProps {
  onEventGenerated?: (event: any) => void;
}

const AutoEventGenerator: React.FC<AutoEventGeneratorProps> = ({ onEventGenerated }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState(5000); // 5 seconds
  const [generatedCount, setGeneratedCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Dynamic realistic data
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

  const contentTypes = {
    post: [
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
    ],
    photo: [
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
    ],
    video: [
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
    ],
    article: [
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
    ],
    product: [
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
    ],
    project: [
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
  };

  const verbs = ['like', 'comment', 'share', 'follow', 'purchase', 'create', 'update', 'view', 'bookmark', 'subscribe'];

  const generateRealisticEvent = () => {
    const actor = users[Math.floor(Math.random() * users.length)];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const objectTypes = Object.keys(contentTypes);
    const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
    const titles = contentTypes[objectType as keyof typeof contentTypes];
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
  };

  const createEvent = async (event: any) => {
    try {
      const response = await eventApi.create(event);
      setGeneratedCount(prev => prev + 1);
      onEventGenerated?.(event);
      return response;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(async () => {
        const event = generateRealisticEvent();
        await createEvent(event);
      }, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, interval]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleBurst = async () => {
    const burstCount = 5;
    for (let i = 0; i < burstCount; i++) {
      const event = generateRealisticEvent();
      await createEvent(event);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-lg font-medium text-gray-900">
            Auto Event Generator
          </h3>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generation Interval (ms)
          </label>
          <input
            type="number"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            min="1000"
            max="30000"
            step="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={handleToggle}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isRunning
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </button>

          <button
            onClick={handleBurst}
            disabled={isRunning}
            className="inline-flex items-center px-3 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md text-sm font-medium disabled:opacity-50"
          >
            <Zap className="h-4 w-4 mr-2" />
            Burst (5x)
          </button>
        </div>

        <div className="text-sm text-gray-500">
          Generated: <span className="font-medium text-gray-900">{generatedCount}</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        {isRunning ? (
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Generating events every {interval / 1000}s
          </span>
        ) : (
          'Click Start to begin automatic event generation'
        )}
      </div>
    </div>
  );
};

export default AutoEventGenerator;