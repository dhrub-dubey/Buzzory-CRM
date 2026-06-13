import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, CreditCard, Users, Briefcase, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';

const folders = [
  { label: 'Client Payments', icon: CreditCard, path: '/finance/client-payments', color: 'from-blue-500 to-blue-600', desc: 'Track payments from clients' },
  { label: 'Influencer Payments', icon: Users, path: '/finance/influencer-payments', color: 'from-purple-500 to-purple-600', desc: 'Manage influencer payouts' },
  { label: 'Employee Salaries', icon: Briefcase, path: '/finance/salaries', color: 'from-green-500 to-green-600', desc: 'Monthly salary management' },
  { label: 'Company Fund', icon: Wallet, path: '/finance/fund-ledger', color: 'from-orange-500 to-orange-600', desc: 'Fund balance & transactions' },
];

export default function Finance() {
  return (
    <div>
      <PageHeader icon={DollarSign} title="Finance" subtitle="Manage all financial operations" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {folders.map(folder => (
          <Link key={folder.path} to={folder.path}>
            <Card className="p-6 border border-border/50 hover:border-orange-500/30 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${folder.color} flex items-center justify-center shadow-lg`}>
                  <folder.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-orange-500 transition-colors">{folder.label}</h3>
                  <p className="text-sm text-muted-foreground">{folder.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}