import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ActiveCampaignCarousel({ campaigns }) {
  const [page, setPage] = React.useState(0);
  const perPage = 3;
  const totalPages = Math.ceil(campaigns.length / perPage);
  const visible = campaigns.slice(page * perPage, (page + 1) * perPage);

  if (campaigns.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Active Campaigns</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((campaign) => (
          <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
            <Card className="p-4 border border-border/50 hover:border-orange-500/30 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors truncate">{campaign.name}</h3>
                <Badge className="bg-green-500/10 text-green-600 text-[10px] border-0">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 truncate">{campaign.client_name}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {campaign.start_date ? format(new Date(campaign.start_date), 'MMM d') : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {campaign.assigned_manager || 'Unassigned'}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}