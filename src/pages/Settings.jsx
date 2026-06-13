import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings as SettingsIcon, Building2, Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const handleInvite = async () => {
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, 'user');
    // Note: role assignment happens after user accepts invite
    setInviting(false);
    setShowInvite(false);
    setInviteEmail('');
  };

  const roleLabels = { super_admin: 'Super Admin', board_member: 'Board Member', campaign_manager: 'Campaign Manager', finance_team: 'Finance Team', employee: 'Employee' };
  const roleColors = { super_admin: 'bg-red-100 text-red-600', board_member: 'bg-purple-100 text-purple-600', campaign_manager: 'bg-blue-100 text-blue-600', finance_team: 'bg-green-100 text-green-600', employee: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Manage your CRM settings" />

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" /> Company</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
          <TabsTrigger value="crm" className="gap-2"><Layers className="w-4 h-4" /> CRM Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border border-border/50">
            <CardHeader><CardTitle className="text-sm">Company Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Company Name</Label><Input defaultValue="Buzzory" /></div>
                <div><Label className="text-xs">Email</Label><Input defaultValue="hello@buzzory.com" /></div>
                <div><Label className="text-xs">Phone</Label><Input defaultValue="+91 98765 43210" /></div>
                <div><Label className="text-xs">Address</Label><Input defaultValue="123, Park Street, Kolkata" /></div>
              </div>
              <div><Label className="text-xs">Bank Details</Label><Input placeholder="Bank Name, Account No, IFSC" /></div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">User Management</CardTitle>
              <Button onClick={() => setShowInvite(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">Invite User</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Email</TableHead><TableHead className="text-xs">Role</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm font-medium">{u.full_name || 'User'}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell><Badge className={`${roleColors[u.role] || roleColors.employee} border-0 text-[10px]`}>{roleLabels[u.role] || 'Employee'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm">
          <Card className="border border-border/50">
            <CardHeader><CardTitle className="text-sm">CRM Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Cities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Kolkata', 'Siliguri', 'Assam', 'Guwahati', 'Delhi', 'Northeast', 'Celebrity'].map(c => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Influencer Statuses</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Not Contacted', 'Contacted', 'Confirmed', 'Mail Done', 'Brief Given', 'Shoot Done', 'Content Received', 'Approved', 'Posted'].map(s => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Categories</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Fashion', 'Lifestyle', 'Beauty', 'Food', 'Fitness', 'Technology', 'Celebrity'].map(c => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Email Address</Label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" /></div>
            <div><Label className="text-xs">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="campaign_manager">Campaign Manager</SelectItem>
                  <SelectItem value="finance_team">Finance Team</SelectItem>
                  <SelectItem value="board_member">Board Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviting} className="w-full bg-orange-500 hover:bg-orange-600 text-white">{inviting ? 'Inviting...' : 'Send Invite'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}