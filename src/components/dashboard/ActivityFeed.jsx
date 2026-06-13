import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Megaphone, DollarSign, Users, FileText, Zap } from 'lucide-react';
import { format } from 'date-fns';

const iconMap = {
  campaign: Megaphone,
  payment: DollarSign,
  influencer: Users,
  invoice: FileText,
  system: Zap,
};

const colorMap = {
  campaign: 'bg-blue-500/10 text-blue-500',
  payment: 'bg-green-500/10 text-green-500',
  influencer: 'bg-purple-500/10 text-purple-500',
  invoice: 'bg-orange-500/10 text-orange-500',
  system: 'bg-gray-500/10 text-gray-500',
};

export default function ActivityFeed({ activities }) {
  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          )}
          {activities.slice(0, 10).map((activity) => {
            const Icon = iconMap[activity.type] || Zap;
            const colorClass = colorMap[activity.type] || colorMap.system;
            return (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {activity.created_date ? format(new Date(activity.created_date), 'MMM d, h:mm a') : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}