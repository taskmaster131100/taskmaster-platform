import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Download, Loader2, Calendar, CheckCircle, RefreshCw, Music, Target } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Metrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalEvents: number;
  upcomingEvents: number;
  totalPlannings: number;
  activePlannings: number;
  totalShows: number;
  upcomingShows: number;
  totalArtists: number;
  totalKPIs: number;
  completedKPIs: number;
}

const ReportsPageEnhanced: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalPlannings: 0,
    activePlannings: 0,
    totalShows: 0,
    upcomingShows: 0,
    totalArtists: 0,
    totalKPIs: 0,
    completedKPIs: 0
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);

      // Load tasks metrics
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      // Load calendar events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('event_date, event_type');

      // Load plannings
      const { data: plannings } = await supabase
        .from('plannings')
        .select('status');

      // Load shows
      const { data: shows } = await supabase
        .from('shows')
        .select('date, status');

      // Load artists (from projects or separate artists table)
      const { data: artists } = await supabase
        .from('artists')
        .select('id');

      // Load KPIs
      const { data: kpis } = await supabase
        .from('kpis')
        .select('current_value, target_value');

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const totalEvents = events?.length || 0;

      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = events?.filter(e => e.event_date >= today).length || 0;

      const totalPlannings = plannings?.length || 0;
      const activePlannings = plannings?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0;

      const totalShows = shows?.length || 0;
      const upcomingShows = shows?.filter(s => s.date >= today && s.status !== 'cancelled').length || 0;

      const totalArtists = artists?.length || 0;

      const totalKPIs = kpis?.length || 0;
      const completedKPIs = kpis?.filter(k => k.current_value >= k.target_value).length || 0;

      setMetrics({
        totalTasks,
        completedTasks,
        inProgressTasks,
        totalEvents,
        upcomingEvents,
        totalPlannings,
        activePlannings,
        totalShows,
        upcomingShows,
        totalArtists,
        totalKPIs,
        completedKPIs
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Error loading metrics');
    } finally {
      setLoading(false);
    }
  }

  const taskCompletionRate = metrics.totalTasks > 0
    ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
    : 0;

  const kpiCompletionRate = metrics.totalKPIs > 0
    ? Math.round((metrics.completedKPIs / metrics.totalKPIs) * 100)
    : 0;

  const metricCards = [
    {
      label: 'Total Tasks',
      value: metrics.totalTasks.toString(),
      subtext: `${metrics.completedTasks} completed`,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Completion Rate',
      value: `${taskCompletionRate}%`,
      subtext: 'of tasks',
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Events',
      value: metrics.totalEvents.toString(),
      subtext: `${metrics.upcomingEvents} upcoming`,
      icon: Calendar,
      color: 'purple'
    },
    {
      label: 'Shows',
      value: metrics.totalShows.toString(),
      subtext: `${metrics.upcomingShows} upcoming`,
      icon: Music,
      color: 'pink'
    },
    {
      label: 'Active Plannings',
      value: metrics.activePlannings.toString(),
      subtext: `of ${metrics.totalPlannings} total`,
      icon: TrendingUp,
      color: 'orange'
    },
    {
      label: 'Artists',
      value: metrics.totalArtists.toString(),
      subtext: 'managed',
      icon: Users,
      color: 'indigo'
    },
    {
      label: 'KPIs',
      value: metrics.totalKPIs.toString(),
      subtext: `${metrics.completedKPIs} achieved`,
      icon: Target,
      color: 'teal'
    },
    {
      label: 'KPI Success Rate',
      value: `${kpiCompletionRate}%`,
      subtext: 'goals achieved',
      icon: TrendingUp,
      color: 'emerald'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">View performance metrics and system analytics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Metric Cards - 4 columns on large screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Task Distribution</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">To Do</span>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${metrics.totalTasks > 0 ? Math.round(((metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks) / metrics.totalTasks) * 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">In Progress</span>
                <span className="text-sm font-medium text-gray-900">{metrics.inProgressTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${metrics.totalTasks > 0 ? Math.round((metrics.inProgressTasks / metrics.totalTasks) * 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-gray-900">{metrics.completedTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${taskCompletionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-600">{metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks}</p>
                <p className="text-sm text-gray-600">To Do</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FFAD85]">{metrics.inProgressTasks}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.completedTasks}</p>
                <p className="text-sm text-gray-600">Done</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shows & Events Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Shows & Events</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Shows</p>
                <p className="text-2xl font-bold text-pink-600">{metrics.totalShows}</p>
              </div>
              <Music className="w-8 h-8 text-pink-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Upcoming Shows</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.upcomingShows}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-[#FFAD85]">{metrics.upcomingEvents}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#FFAD85]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Active Plannings</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.activePlannings}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border-l-4 border-[#FFAD85] pl-4">
            <p className="text-sm text-gray-600 mb-1">Productivity</p>
            <p className="text-xl font-bold text-gray-900">{taskCompletionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Task completion rate</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Schedule</p>
            <p className="text-xl font-bold text-gray-900">{metrics.upcomingEvents + metrics.upcomingShows}</p>
            <p className="text-xs text-gray-500 mt-1">Upcoming activities</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Planning</p>
            <p className="text-xl font-bold text-gray-900">{metrics.activePlannings}</p>
            <p className="text-xs text-gray-500 mt-1">Active plannings</p>
          </div>
          <div className="border-l-4 border-teal-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">KPI Success</p>
            <p className="text-xl font-bold text-gray-900">{kpiCompletionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Goals achieved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPageEnhanced;
