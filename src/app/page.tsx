"use client";

import React, { useState, useEffect } from 'react';
import LoginButton from '@/components/LoginButton';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

export default function Home() {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date(Date.now() + 3600000));
  const [reschedulingPostId, setReschedulingPostId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  const handleSchedule = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Scheduling for 1 day in the future for demo purposes
        body: JSON.stringify({ content, scheduledTime: new Date(Date.now() + 86400000) }), 
      });
      if (res.ok) {
        setContent('');
        alert('Post scheduled successfully!');
        fetchPosts(); // Refresh list
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCancel = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReschedule = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime: rescheduleTime }),
      });
      if (res.ok) {
        setReschedulingPostId(null);
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const calculateStreak = () => {
    const publishedPosts = posts.filter(p => p.status === 'published');
    if (publishedPosts.length === 0) return 0;
    
    const publishedDates = Array.from(new Set(
      publishedPosts.map(p => new Date(p.scheduledTime).toDateString())
    )).map(d => new Date(d));

    publishedDates.sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let checkDate = new Date(publishedDates[0]);
    checkDate.setHours(0,0,0,0);

    if (today.getTime() - checkDate.getTime() > 86400000) return 0;

    for (let i = 0; i < publishedDates.length; i++) {
      const d = new Date(publishedDates[i]);
      d.setHours(0,0,0,0);
      const expected = new Date(checkDate);
      expected.setDate(checkDate.getDate() - i);
      if (d.getTime() === expected.getTime()) streak++;
      else break;
    }
    return streak;
  };

  const calculateTotalVolume = () => {
    return posts
      .filter(p => p.status === 'published')
      .reduce((sum, p) => sum + p.content.length, 0);
  };

  const getHeatmapData = () => {
    const counts: Record<string, number> = {};
    posts.filter(p => p.status === 'published').forEach(p => {
      const date = new Date(p.scheduledTime).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.keys(counts).map(date => ({ date, count: counts[date] }));
  };

  const renderAnalytics = () => {
    const published = posts.filter(p => p.status === 'published').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const drafts = posts.filter(p => p.status === 'draft').length;
    const failed = posts.filter(p => p.status === 'failed').length;

    const pieData = [
      { name: 'Published', value: published },
      { name: 'Scheduled', value: scheduled },
      { name: 'Drafts', value: drafts },
      { name: 'Failed', value: failed },
    ];

    const COLORS = ['#10b981', '#3b82f6', '#6b7280', '#ef4444'];

    return (
      <div className="analytics-container" style={{ display: 'grid', gap: '24px' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Character Volume</div>
            <div className="stat-value">{calculateTotalVolume()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Current Streak</div>
            <div className="stat-value">{calculateStreak()} 🔥</div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h2>Consistency Heatmap</h2>
          </div>
          <div className="heatmap-container" style={{ padding: '20px 0' }}>
            <CalendarHeatmap
              startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              endDate={new Date()}
              values={getHeatmapData()}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
            />
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h2>Post Status Distribution</h2>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            {pieData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index] }}></div>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
            <rect x="2" y="9" width="4" height="12"></rect>
            <circle cx="4" cy="4" r="2"></circle>
          </svg>
          <span>InSingh</span>
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>Dashboard</li>
          <li className="nav-item">Scheduled</li>
          <li className="nav-item">Drafts</li>
          <li className={`nav-item ${activeTab === 'Analytics' ? 'active' : ''}`} onClick={() => setActiveTab('Analytics')}>Analytics</li>
          <li className="nav-item">Settings</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1>Overview</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {session?.user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{session.user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)' }}>{calculateStreak()} 🔥 Streak</div>
                </div>
                {session.user.image && (
                  <img src={session.user.image} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                )}
              </div>
            )}
            <LoginButton />
          </div>
        </header>

        {session ? (
          <>
            {activeTab === 'Dashboard' ? (
              <>
                {/* Stats */}
                <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-title">Total Posts</div>
                <div className="stat-value">{posts.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Scheduled</div>
                <div className="stat-value" style={{ color: 'var(--accent)' }}>
                  {posts.filter(p => p.status === 'scheduled').length}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Avg. Engagement</div>
                <div className="stat-value">TBD</div>
              </div>
            </div>

            {/* Content Layout */}
            <div className="content-grid">
              {/* Upcoming Posts */}
              <div className="section-card">
                <div className="section-header">
                  <h2>Upcoming Posts</h2>
                  <button className="btn-secondary">View All</button>
                </div>
                <div className="post-list">
                  {posts.length === 0 ? (
                    <div style={{ color: '#a1a1aa', fontSize: '14px', fontStyle: 'italic' }}>
                      No posts scheduled yet. Draft one below!
                    </div>
                  ) : (
                    posts.map(post => (
                      <div className="post-item" key={post.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="post-content">
                            <div className="post-text">"{post.content}"</div>
                            <div className="post-meta">
                              <span>Scheduled for: {new Date(post.scheduledTime).toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                            <div className="status-badge">{post.status}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setReschedulingPostId(post.id); setRescheduleTime(new Date(post.scheduledTime)); }}>Reschedule</button>
                              <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleCancel(post.id)}>Cancel</button>
                            </div>
                          </div>
                        </div>
                        {reschedulingPostId === post.id && (
                          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <DatePicker
                                selected={rescheduleTime}
                                onChange={(date: Date | null) => date && setRescheduleTime(date)}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                timeCaption="Time"
                                dateFormat="MMMM d, yyyy h:mm aa"
                                className="custom-datepicker-input"
                                wrapperClassName="datepicker-wrapper"
                              />
                            </div>
                            <button className="btn-primary" onClick={() => handleReschedule(post.id)}>Save</button>
                            <button className="btn-secondary" onClick={() => setReschedulingPostId(null)}>Cancel</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Create */}
              <div className="section-card">
                <div className="section-header">
                  <h2>Quick Draft</h2>
                </div>
                <div className="create-post-form">
                  <textarea 
                    placeholder="What do you want to talk about?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  ></textarea>
                  <div className="create-post-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <DatePicker
                        selected={scheduledTime}
                        onChange={(date: Date | null) => date && setScheduledTime(date)}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="custom-datepicker-input"
                        wrapperClassName="datepicker-wrapper"
                      />
                    </div>
                    <button className="btn-primary" onClick={async () => {
                      if (!content || !scheduledTime) return;
                      setLoading(true);
                      try {
                        const res = await fetch('/api/posts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ content, scheduledTime }), 
                        });
                        if (res.ok) {
                          setContent('');
                          alert('Post scheduled successfully!');
                          fetchPosts();
                        }
                      } catch (e) {
                        console.error(e);
                      }
                      setLoading(false);
                    }} disabled={loading || !content}>
                      {loading ? "Scheduling..." : "Schedule"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </>
            ) : activeTab === 'Analytics' ? (
              renderAnalytics()
            ) : null}
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#a1a1aa' }}>
            <h2>Please log in to manage your LinkedIn posts.</h2>
          </div>
        )}
      </main>
    </div>
  );
}
