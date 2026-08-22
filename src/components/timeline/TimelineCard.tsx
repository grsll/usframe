import React from 'react';
import { Milestone } from '../../types';
import { formatDateFull } from '../../lib/utils';
import { MapPin, Calendar, Sparkles } from 'lucide-react';

interface TimelineCardProps {
  milestone: Milestone;
  isLast?: boolean;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ milestone, isLast }) => {
  return (
    <div className="relative flex gap-3 sm:gap-8 group">
      
      {/* Central Line & Timeline Node Marker */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-surface border-2 border-terracotta-500 text-terracotta-500 flex items-center justify-center shadow-soft z-10 group-hover:scale-110 group-hover:bg-terracotta-500 group-hover:text-white transition-all duration-300">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border group-hover:bg-terracotta-300 dark:group-hover:bg-terracotta-800 transition-colors my-1.5 sm:my-2" />
        )}
      </div>

      {/* Milestone Card Body */}
      <div className="flex-1 pb-6 sm:pb-10 min-w-0">
        <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-soft group-hover:shadow-medium group-hover:border-terracotta-200 dark:group-hover:border-terracotta-800 transition-all space-y-2.5 sm:space-y-3">
          
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-foreground-muted">
              <span className="flex items-center gap-1 text-terracotta-600 dark:text-terracotta-400 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateFull(milestone.date)}
              </span>
              {milestone.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                    {milestone.location}
                  </span>
                </>
              )}
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground tracking-tight">
              {milestone.title}
            </h3>
          </div>

          {milestone.image_url && (
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-stone-900 shadow-xs">
              <img
                src={milestone.image_url}
                alt={milestone.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          )}

          <p className="text-xs sm:text-base text-foreground-muted leading-relaxed font-normal">
            {milestone.description}
          </p>

        </div>
      </div>

    </div>
  );
};
