import React, { useState } from 'react';
import { Milestone } from '../../types';
import { TimelineCard } from './TimelineCard';
import { Plus, Heart } from 'lucide-react';
import { Button } from '../ui/Button';
import { AddMilestoneModal } from './AddMilestoneModal';

interface TimelineListProps {
  milestones: Milestone[];
  onAddMilestone: (m: Milestone) => void;
}

export const TimelineList: React.FC<TimelineListProps> = ({
  milestones,
  onAddMilestone
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Sort chronological by date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-500">
              <Heart className="w-5 h-5 fill-current" />
            </span>
            <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">
              Our Relationship Journey
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Every chapter, flight, and milestone written together across time and distance.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          variant="primary"
          size="md"
          className="shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add Milestone</span>
        </Button>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-2 sm:pl-4">
        {sortedMilestones.map((milestone, idx) => (
          <TimelineCard
            key={milestone.id}
            milestone={milestone}
            isLast={idx === sortedMilestones.length - 1}
          />
        ))}
      </div>

      {/* Add Milestone Modal */}
      <AddMilestoneModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddMilestone={onAddMilestone}
      />

    </div>
  );
};
