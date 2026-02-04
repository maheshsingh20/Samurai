import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Activity } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { AnalyticsResponse, TopItem } from '../types';

const Analytics: React.FC = () => {
  const [topObjects, setTopObjects] = useState<TopItem[]>([]);
  const [topVerbs, setTopVerbs] = useState<TopItem[]>([]);
  const [topObjectTypes, setTopObjectTypes] = useState<TopItem[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<'1m' | '5m' | '1h'>('1h');
  const [loading, setLoading] = useState(true);

  const windows = [
    { value: '1m' as const, label: '1 Minute', icon: Clock },
    { value: '5m' as const, label: '5 Minutes', icon: Clock },
    { value: '1h' as const, label: '1 Hour', icon: Clock }
  ];

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [objects, verbs, objectTypes] = await Promise.all([
          analyticsApi.getTop({ window: selectedWindow, type: 'objects', limit: 20 }),
          analyticsApi.getTop({ window: selectedWindow, type: 'verbs', limit: 10 }),
          analyticsApi.getTop({ window: selectedWindow, type: 'objectTypes', limit: 10 })
        ]);

        setTopObjects(objects.items);
        setTopVerbs(verbs.items);
        setTopObjectTypes(objectTypes.items);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Auto-refresh for shorter windows
    let interval: NodeJS.Timeout | null = null;
    if (selectedWindow === '1m') {
      interval = setInterval(fetchAnalytics, 10000); // 10 seconds
    } else if (selectedWindow === '5m') {
      interval = setInterval(fetchAnalytics, 30000); // 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedWindow]);

  const formatChartData = (items: TopItem[]) => {
    return items.map(item => ({
      name: item.item.length > 20 ? `${item.item.substring(0, 20)}...` : item.item,
      fullName: item.item,
      value: item.count
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Real-time activity analytics and trends
          </p>
        </div>

        {/* Time Window Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {windows.map((window) => {
            const Icon = window.icon;
            return (
              <button
                key={window.value}
                onClick={() => setSelectedWindow(window.value)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedWindow === window.value
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {window.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Top Objects</p>
              <p className="text-2xl font-bold text-gray-900">{topObjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Activity Types</p>
              <p className="text-2xl font-bold text-gray-900">{topVerbs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {topObjects.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Objects Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Objects ({selectedWindow})
          </h3>
          {topObjects.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatChartData(topObjects.slice(0, 10))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => [value, 'Count']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || label;
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Top Verbs Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activity Types ({selectedWindow})
          </h3>
          {topVerbs.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatChartData(topVerbs)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatChartData(topVerbs).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Object Types Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Object Types ({selectedWindow})
          </h3>
          {topObjectTypes.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topObjectTypes.map((item, index) => (
                    <tr key={item.item}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Top Objects Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Object Rankings ({selectedWindow})
          </h3>
          {topObjects.length > 0 ? (
            <div className="overflow-hidden max-h-80 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Object
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topObjects.map((item, index) => (
                    <tr key={item.item}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate">
                        {item.item}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;