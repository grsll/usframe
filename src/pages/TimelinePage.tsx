import React, { useState } from 'react';
import { Milestone } from '../types';
import { storage } from '../lib/storage';
import { TimelineList } from '../components/timeline/TimelineList';

export const TimelinePage: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>(() => storage.getMilestones());

  const handleAddMilestone = (m: Milestone) => {
    const updated = storage.addMilestone(m);
    setMilestones(updated);
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
