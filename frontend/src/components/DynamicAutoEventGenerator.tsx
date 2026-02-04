import React, { useState, useEffect } from 'react';
import { Play, Pause, Zap, Settings, Users, TrendingUp } from 'lucide-react';
import { dynamicApi, DynamicUser } from '../services/dynamicApi';

interface DynamicAutoEventGeneratorProps {
  onEventGenerated?: (event: any) => void;
}

const DynamicAutoEventGenerator: React.FC<DynamicAutoEventGeneratorProps> = ({ onEventGenerated }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState(5000); // 5 seconds
  const [generatedCount, setGeneratedCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [users, setUsers] = useState<DynamicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const dynamicUsers = await dynamicApi.getUsers();
        setUsers(dynamicUsers);
      } catch (error) {
        console.error('Error loading dynamic users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDynamicData();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(async () => {
        try {
          const result = await dynamicApi.generateEvent();
          setGeneratedCount(prev => prev + 1);
          setLastEvent(result.event);
          onEventGenerated?.(result.event);
        } catch (error) {
          console.error('Error generating dynamic event:', error);
        }
      }, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, interval, onEventGenerated]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleBurst = async () => {
    const burstCount = 5;
    for (let i = 0; i < burstCount; i++) {
      try {
        const result = await dynamicApi.generateEvent();
        setGeneratedCount(prev => prev + 1);
        setLastEvent(result.event);
        onEventGenerated?.(result.event);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Error in burst generation:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const onlineUsers = users.filter(u => u.isOnline);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-lg font-medium text-gray-900">
            🌐 Dynamic Event Generator
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

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-500" />
              <span>Total Users: <strong>{users.length}</strong></span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Online: <strong>{onlineUsers.length}</strong></span>
            </div>
          </div>
        </div>
      )}

      {lastEvent && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm">
            <div className="font-medium text-blue-900">Last Generated Event:</div>
            <div className="text-blue-800 mt-1">
              {lastEvent.actor_name} {lastEvent.verb} {lastEvent.object_type} "{lastEvent.object_title}"
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Targets: {lastEvent.target_user_ids?.length || 0} users
            </div>
          </div>
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
            Generating events every {interval / 1000}s using live data from external APIs
          </span>
        ) : (
          'Click Start to begin dynamic event generation from real external data sources'
        )}
      </div>

      {/* Dynamic User Preview */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Active Users (Live Data)</span>
          <TrendingUp className="h-3 w-3 text-green-500" />
        </div>
        <div className="flex flex-wrap gap-1">
          {onlineUsers.slice(0, 8).map(user => (
            <div
              key={user.id}
              className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
              title={`${user.name} - ${user.company || 'No company'}`}
            >
              <span className="mr-1">{user.avatar}</span>
              <span className="truncate max-w-20">{user.name.split(' ')[0]}</span>
            </div>
          ))}
          {onlineUsers.length > 8 && (
            <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              +{onlineUsers.length - 8} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicAutoEventGenerator;