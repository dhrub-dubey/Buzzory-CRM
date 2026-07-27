import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase, fetchUsers, deleteUser } from '@/lib/supabase';
import { Settings as SettingsIcon, Building2, Users, Layers, MapPin, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SwipeableUserRow from '@/components/settings/SwipeableUserRow';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialCity = searchParams.get("city");
  const initialCategory = searchParams.get("category");
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviting, setInviting] = useState(false);

  // useEffect(() => {
  //   base44.auth.me().then(setUser).catch(() => {});
  // }, []);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      console.log("SUPABASE USER:", user);
      setUser(user);
    };
  
    loadUser();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const mySupabaseUser = users.find(
    u => u.email === user?.email.toLowerCase()
  );
  
  const myRole = mySupabaseUser?.role;

  const { data: influencers = [] } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => base44.entities.Influencer.list('-created_date', 500),
  });
  
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });
  
  const cities = [...new Set(influencers.map(i => i.city).filter(Boolean))];
  const categories = [...new Set(influencers.map(i => i.category).filter(Boolean))];
  const salesStatuses = [...new Set(leads.map(l => l.status).filter(Boolean))];

  const handleInvite = async () => {
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, 'user');
    // Note: role assignment happens after user accepts invite
    setInviting(false);
    setShowInvite(false);
    setInviteEmail('');
  };

  const roleLabels = { super_admin: 'Super Admin', board_member: 'Board Member', employee: 'Employee' };
  const roleColors = { super_admin: 'bg-orange-100 text-orange-600', board_member: 'bg-purple-100 text-purple-600', employee: 'bg-green-100 text-green-600' };

  const canDeleteUser = (targetUser) => {
    console.log({
      myRole,
      myEmail: user?.email,
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
    });

    if (!myRole || !targetUser) return false;
  
    // don't allow deleting yourself
    if (targetUser.email === user?.email) return false;
  
    if (myRole === 'super_admin') {
      return (
        targetUser.role === 'board_member' ||
        targetUser.role === 'employee'
      );
    }
  
    if (myRole === 'board_member') {
      return targetUser.role === 'employee';
    }
  
    return false;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
  
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
  
      toast({
        title: 'User deleted',
      });
    },
  
    onError: (err) => {
      toast({
        title: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (targetUser) => {
    if (
      !window.confirm(
        `Delete ${targetUser.full_name || targetUser.email}?`
      )
    )
      return;
  
    deleteMutation.mutate(targetUser.id);
  };

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
                <div><Label className="text-xs">Email</Label><Input defaultValue="buzzory@gmail.com" /></div>
                <div><Label className="text-xs">Phone</Label><Input defaultValue="+91 81709 13636" /></div>
                <div><Label className="text-xs">Address</Label><Input defaultValue="Baragharia, Dhupguri, West Bengal - 735210" /></div>
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
            {/* <CardContent>
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {[...users]
                      .sort((a, b) => {
                        const order = {
                          super_admin: 1,
                          board_member: 2,
                          employee: 3,
                        };

                        return (order[a.role] || 99) - (order[b.role] || 99);
                      })
                      .map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm font-medium">{u.full_name || 'User'}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell><Badge className={`${roleColors[u.role] || roleColors.employee} border-0 text-[10px]`}>{roleLabels[u.role] || 'Employee'}</Badge></TableCell>
                      <TableCell className="text-right">
                        {canDeleteUser(u) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(u)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent> */}

            <CardContent>
              <p className="text-[11px] text-muted-foreground mb-3">
                Swipe a row left to reveal the delete option.
              </p>

              <div className="overflow-x-auto">
                <div className="grid grid-cols-[1fr_1fr_140px] gap-3 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border/50 min-w-[480px]">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                </div>

                {[...users]
                  .sort((a, b) => {
                    const order = {
                      super_admin: 1,
                      board_member: 2,
                      employee: 3,
                    };

                    return (order[a.role] || 99) - (order[b.role] || 99);
                  })
                  .map((u) => (
                    <SwipeableUserRow
                      key={u.id}
                      user={u}
                      canDelete={canDeleteUser(u)}
                      onDelete={() => handleDelete(u)}
                      roleLabels={roleLabels}
                      roleColors={roleColors}
                    />
                  ))}
              </div>
            </CardContent>

          </Card>
        </TabsContent>

        <TabsContent value="crm">
            <Card className="border border-border/50">
              <CardHeader>
                <div>
                  <CardTitle className="text-sm">CRM Configuration</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Live values pulled from your Influencers and Sales Tracker. Click any item to jump to the filtered list.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">

                {/* Cities */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Cities
                    <span className="text-muted-foreground font-normal">
                      ({cities.length})
                    </span>
                  </Label>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {cities.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No cities from influencers yet.
                      </p>
                    )}

                    {cities.map(c => {
                      const count = influencers.filter(i => i.city === c).length;

                      return (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-orange-500/10 hover:border-orange-500/40 hover:text-orange-600 transition-colors"
                          onClick={() =>
                            navigate(`/influencers?city=${encodeURIComponent(c)}`)
                          }
                        >
                          {c}
                          <span className="ml-1 text-muted-foreground">
                            {count}
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Sales Statuses */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-orange-500" />
                    Sales Statuses
                    <span className="text-muted-foreground font-normal">
                      ({salesStatuses.length})
                    </span>
                  </Label>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {salesStatuses.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No statuses from sales tracker yet.
                      </p>
                    )}

                    {salesStatuses.map(s => {
                      const count = leads.filter(l => l.status === s).length;

                      return (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-orange-500/10 hover:border-orange-500/40 hover:text-orange-600 transition-colors"
                          onClick={() =>
                            navigate(`/sales?status=${encodeURIComponent(s)}`)
                          }
                        >
                          {s}
                          <span className="ml-1 text-muted-foreground">
                            {count}
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <Label className="text-xs font-semibold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                    Categories
                    <span className="text-muted-foreground font-normal">
                      ({categories.length})
                    </span>
                  </Label>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No categories from influencers yet.
                      </p>
                    )}

                    {categories.map(c => {
                      const count = influencers.filter(i => i.category === c).length;

                      return (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-orange-500/10 hover:border-orange-500/40 hover:text-orange-600 transition-colors"
                          onClick={() =>
                            navigate(`/influencers?category=${encodeURIComponent(c)}`)
                          }
                        >
                          {c}
                          <span className="ml-1 text-muted-foreground">
                            {count}
                          </span>
                        </Badge>
                      );
                    })}
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