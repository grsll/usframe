import React, { useState, useEffect, useCallback } from 'react';
import { Milestone } from '../types';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { roomService } from '../lib/roomService';
import { TimelineList } from '../components/timeline/TimelineList';

export const TimelinePage: React.FC = () => {
  const { couple } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>(() => storage.getMilestones());

  const loadMilestones = useCallback(async () => {
    const fresh = await roomService.fetchMilestones(couple?.id);
    setMilestones(fresh);
  }, [couple?.id]);

  useEffect(() => {
    loadMilestones();
    const unsub = roomService.subscribeToMilestones(couple?.id, loadMilestones);
    return () => {
      unsub();
    };
  }, [loadMilestones, couple?.id]);

  const handleAddMilestone = async (m: Milestone) => {
    const created = await roomService.createMilestone({
      coupleId: couple?.id || 'couple_main',
      title: m.title,
      description: m.description,
      date: m.date,
      location: m.location,
      imageUrl: m.image_url,
      category: m.category
    });
    setMilestones(prev => [...prev.filter(item => item.id !== created.id), created]);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-7xl mx-auto">
      <TimelineList
        milestones={milestones}
        onAddMilestone={handleAddMilestone}
      />
    </div>
  );
};
