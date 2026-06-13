import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

export function CampaignPerformanceChart({ campaigns }) {
  const data = campaigns.slice(0, 6).map(c => ({
    name: c.name?.substring(0, 12) || 'N/A',
    budget: c.budget || 0,
    revenue: c.revenue || 0,
  }));

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220 9% 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 9% 46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
              <Bar dataKey="budget" fill="hsl(222 47% 25%)" radius={[4, 4, 0, 0]} name="Budget" />
              <Bar dataKey="revenue" fill="hsl(25 95% 53%)" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueChart({ payments, fullWidth }) {
  const monthlyData = getMonthlyData(payments, 'amount');

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={fullWidth ? 'h-96' : 'h-64'}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220 9% 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 9% 46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
              <Area type="monotone" dataKey="amount" stroke="hsl(25 95% 53%)" fill="hsl(25 95% 53%)" fillOpacity={0.1} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfitChart({ clientPayments, influencerPayments }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  const data = months.map((month, idx) => {
    const revenue = (Array.isArray(clientPayments) ? clientPayments : []).filter(p => {
      const d = new Date(p.received_date || p.created_date);
      return d.getMonth() === idx && d.getFullYear() === currentYear;
    }).reduce((s, p) => s + (p.amount || 0), 0);

    const cost = influencerPayments.filter(p => {
      const d = new Date(p.payment_date || p.created_date);
      return d.getMonth() === idx && d.getFullYear() === currentYear;
    }).reduce((s, p) => s + (p.amount || 0), 0);

    return { month, revenue, cost, profit: revenue - cost };
  });

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Profit Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220 9% 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 9% 46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="cost" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Cost" />
              <Line type="monotone" dataKey="profit" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// function getMonthlyData(records, amountField) {
//   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//   const currentYear = new Date().getFullYear();
//   return months.map((month, idx) => {
//     const total = records.filter(r => {
//       const d = new Date(r.received_date || r.payment_date || r.created_date);
//       return d.getMonth() === idx && d.getFullYear() === currentYear;
//     }).reduce((s, r) => s + (r[amountField] || 0), 0);
//     return { month, amount: total };
//   });
// }

function getMonthlyData(records, amountField) {
  const safeRecords = Array.isArray(records) ? records : [];

  console.log("RevenueChart records:", records);
  console.log("RevenueChart isArray:", Array.isArray(records));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  return months.map((month, idx) => {
    const total = safeRecords
      .filter(r => {
        const d = new Date(
          r.received_date ||
          r.payment_date ||
          r.created_date
        );

        return (
          d.getMonth() === idx &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((s, r) => s + (r[amountField] || 0), 0);

    return { month, amount: total };
  });
}