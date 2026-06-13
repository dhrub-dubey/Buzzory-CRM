import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, Megaphone, CheckCircle, DollarSign, TrendingUp, Wallet, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { RevenueChart } from '@/components/dashboard/DashboardCharts';

const ADMIN_EMAIL = "buzzory.it@gmail.com";

function CampaignOptInCard({ campaign }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow border border-border/50">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{campaign.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{campaign.client_name}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-0 text-[10px] flex-shrink-0">Active</Badge>
      </div>
      {campaign.brief && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{campaign.brief}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        {campaign.start_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {campaign.start_date}
          </span>
        )}
        {campaign.assigned_manager && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {campaign.assigned_manager}
          </span>
        )}
      </div>
      <Link
        to={`/campaigns/${campaign.id}`}
        className="block w-full text-center text-xs font-semibold text-orange-500 border border-orange-200 rounded-lg py-2 hover:bg-orange-50 transition-colors"
      >
        View & Opt In
      </Link>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useOutletContext() || {};
  const [dateFilter, setDateFilter] = useState('this_month');

  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'admin';
  const isBoardMember = user?.role === 'board_member';
  const isInfluencer = user?.role === 'influencer';
  const showFinancials = isAdmin || isBoardMember;

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const { data: clientPayments = [] } = useQuery({
    queryKey: ['clientPayments'],
    queryFn: () => base44.entities.ClientPayment.list('-created_date', 200),
    enabled: showFinancials,
  });

  const { data: influencerPayments = [] } = useQuery({
    queryKey: ['influencerPayments'],
    queryFn: () => base44.entities.InfluencerPayment.list('-created_date', 200),
    enabled: showFinancials,
  });

  const { data: fundTransactions = [] } = useQuery({
    queryKey: ['fundTransactions'],
    queryFn: () => base44.entities.FundTransaction.list('-created_date', 200),
    enabled: showFinancials,
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');
  const totalRevenue = clientPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalCosts = influencerPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalProfit = totalRevenue - totalCosts;
  const fundBalance = fundTransactions.reduce((s, t) => s + (t.amount_credited || 0) - (t.amount_debited || 0), 0);
  const formatCurrency = (v) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'there'}!`}>
        {showFinancials && (
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      {/* Stat Cards */}
      <div className={`grid gap-4 mb-6 ${showFinancials ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3'}`}>
        <StatCard title="Total Campaigns" value={campaigns.length} icon={Megaphone} color="orange" />
        <StatCard title="Active" value={activeCampaigns.length} icon={Megaphone} color="blue" />
        <StatCard title="Completed" value={completedCampaigns.length} icon={CheckCircle} color="green" />
        {showFinancials && (
          <>
            <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="purple" />
            <StatCard title="Total Profit" value={formatCurrency(totalProfit)} icon={TrendingUp} color="pink" />
            <StatCard title="Fund Balance" value={formatCurrency(fundBalance)} icon={Wallet} color="indigo" />
          </>
        )}
      </div>

      {/* Influencer view: show active campaigns to opt into */}
      {isInfluencer ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-700">Active Campaigns — Available to Opt In</h2>
          </div>
          {activeCampaigns.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              No active campaigns available at the moment.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeCampaigns.map(c => <CampaignOptInCard key={c.id} campaign={c} />)}
            </div>
          )}
        </div>
      ) : (
        /* Revenue Chart for admin/board_member/employee */
        showFinancials && <RevenueChart payments={clientPayments} fullWidth />
      )}
    </div>
  );
}