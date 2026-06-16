import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, Plus, ArrowLeft, Eye, MoreVertical, Pencil, Trash2, Grid3X3, List, Download, Phone, Mail, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const CATEGORIES = ['Fashion', 'Lifestyle', 'Beauty', 'Food', 'Fitness', 'Technology', 'Celebrity'];
const categoryIcons = { Fashion: '👗', Lifestyle: '✨', Beauty: '💄', Food: '🍴', Fitness: '💪', Technology: '💻', Celebrity: '⭐' };

const emptyForm = { full_name: '', username: '', city: '', category: '', followers: 0, pricing: 0, phone: '', email: '', instagram: '', youtube: '', niche: '', engagement_rate: 0, notes: '', status: 'Active' };

const ITEMS_PER_PAGE = 10;

export default function Influencers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityEmoji, setNewCityEmoji] = useState('📍');
  const [catFilter, setCatFilter] = useState('all');
  const [followFilter, setFollowFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const selectedCity = searchParams.get('city') || null;
  const setSelectedCity = (city) => {
    if (city) setSearchParams({ city });
    else setSearchParams({});
  };
  const cityFilter = selectedCity || '';
  const setCityFilter = (city) => { if (city) setSearchParams({ city }); };

  const { data: cityRecords = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list('name', 100),
  });

  const cities = cityRecords.map(c => c.name);
  const cityEmojiMap = Object.fromEntries(cityRecords.map(c => [c.name, c.emoji || '📍']));

  const createCityMutation = useMutation({
    mutationFn: (data) => base44.entities.City.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cities'] }); setShowAddCity(false); setNewCityName(''); setNewCityEmoji('📍'); },
  });

  const { data: influencers = [] } = useQuery({
    queryKey: ['influencers'],
    queryFn: () => base44.entities.Influencer.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Influencer.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['influencers'] }); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Influencer.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['influencers'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Influencer.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['influencers'] }); setDeleteId(null); },
  });

  const closeDialog = () => { setShowDialog(false); setEditing(null); setForm(emptyForm); };

  const openEdit = (inf) => {
    setEditing(inf);
    setForm({ full_name: inf.full_name, username: inf.username || '', city: inf.city, category: inf.category || '', followers: inf.followers || 0, pricing: inf.pricing || 0, phone: inf.phone || '', email: inf.email || '', instagram: inf.instagram || '', youtube: inf.youtube || '', niche: inf.niche || '', engagement_rate: inf.engagement_rate || 0, notes: inf.notes || '', status: inf.status || 'Active' });
    setShowDialog(true);
  };

  const openAdd = () => {
    setForm({ ...emptyForm, city: selectedCity || '' });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const resetFilters = () => { setCatFilter('all'); setFollowFilter('all'); setPriceFilter('all'); setPage(1); };

  // City selection view
  if (!selectedCity) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Influencers</h1>
              <p className="text-sm text-muted-foreground">Browse influencers by city</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cities.map(city => {
            const count = influencers.filter(i => i.city === city).length;
            return (
              <Card key={city} className="p-6 border border-border/50 hover:border-orange-500/40 hover:shadow-md transition-all cursor-pointer group text-center" onClick={() => { setSelectedCity(city); setCityFilter(city); setPage(1); }}>
                <span className="text-3xl mb-2 block">{cityEmojiMap[city] || '📍'}</span>
                <h3 className="text-sm font-semibold group-hover:text-orange-500 transition-colors">{city}</h3>
                <p className="text-xs text-muted-foreground mt-1">{count} Influencer{count !== 1 ? 's' : ''}</p>
              </Card>
            );
          })}
          {/* Add City tile */}
          <Card
            className="p-6 border border-dashed border-border hover:border-orange-500/60 hover:shadow-md transition-all cursor-pointer group text-center bg-muted/20 hover:bg-orange-500/5"
            onClick={() => { setNewCityName(''); setShowAddCity(true); }}
          >
            <span className="text-3xl mb-2 block">➕</span>
            <h3 className="text-sm font-semibold text-muted-foreground group-hover:text-orange-500 transition-colors">Add City</h3>
            <p className="text-xs text-muted-foreground mt-1">New location</p>
          </Card>
        </div>

        {/* Add City Dialog */}
        <Dialog open={showAddCity} onOpenChange={setShowAddCity}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add New City</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">City Name *</Label><Input value={newCityName} onChange={e => setNewCityName(e.target.value)} placeholder="e.g. Mumbai" autoFocus /></div>
              <div><Label className="text-xs">Emoji Icon</Label><Input value={newCityEmoji} onChange={e => setNewCityEmoji(e.target.value)} placeholder="📍" /></div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!newCityName.trim() || cities.includes(newCityName.trim()) || createCityMutation.isPending}
                onClick={() => createCityMutation.mutate({ name: newCityName.trim(), emoji: newCityEmoji.trim() || '📍' })}
              >
                {createCityMutation.isPending ? 'Saving...' : 'Add City'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const allFiltered = influencers.filter(i => {
    const matchCity = !cityFilter || cityFilter === 'all' ? true : i.city === cityFilter;
    const matchCat = catFilter === 'all' || i.category === catFilter;
    const matchFollow = followFilter === 'all' ||
      (followFilter === '<10k' && (i.followers || 0) < 10000) ||
      (followFilter === '10k-50k' && (i.followers || 0) >= 10000 && (i.followers || 0) < 50000) ||
      (followFilter === '50k-100k' && (i.followers || 0) >= 50000 && (i.followers || 0) < 100000) ||
      (followFilter === '100k+' && (i.followers || 0) >= 100000);
    const matchPrice = priceFilter === 'all' ||
      (priceFilter === '<5k' && (i.pricing || 0) < 5000) ||
      (priceFilter === '5k-20k' && (i.pricing || 0) >= 5000 && (i.pricing || 0) < 20000) ||
      (priceFilter === '20k+' && (i.pricing || 0) >= 20000);
    return matchCity && matchCat && matchFollow && matchPrice;
  });

  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const filtered = allFiltered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold">Influencers</h1>
        </div>
        <Button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Influencer
        </Button>
      </div>

      {/* Back to Cities */}
      <button
        onClick={() => setSelectedCity(null)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 border border-border rounded-lg px-3 py-1.5 hover:bg-muted/30 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Cities
      </button>

      {/* Filters */}
      <Card className="p-4 border border-border/50 mb-5">
        <div className="flex flex-wrap items-end gap-4">
          <span className="text-sm font-semibold text-foreground mb-1">Filters:</span>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Category</p>
            <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Followers</p>
            <Select value={followFilter} onValueChange={v => { setFollowFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="<10k">&lt;10K</SelectItem>
                <SelectItem value="10k-50k">10K–50K</SelectItem>
                <SelectItem value="50k-100k">50K–100K</SelectItem>
                <SelectItem value="100k+">100K+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Pricing</p>
            <Select value={priceFilter} onValueChange={v => { setPriceFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="<5k">&lt;₹5K</SelectItem>
                <SelectItem value="5k-20k">₹5K–₹20K</SelectItem>
                <SelectItem value="20k+">₹20K+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">City</p>
            <Select value={cityFilter} onValueChange={v => { setCityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters} className="text-orange-500 border-orange-500/40 hover:bg-orange-500/5 gap-1.5">
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </Button>
        </div>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{cityFilter || selectedCity} Influencers</h2>
          <Badge variant="outline" className="text-[10px] px-2">{allFiltered.length} Results</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            className={`h-8 w-8 ${viewMode === 'table' ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={openAdd} className="text-xs gap-1 h-8 bg-transparent border border-border text-foreground hover:bg-muted">
            <Plus className="w-3 h-3" /> Add Row
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border/50 overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold text-foreground/70 py-3">Influencer</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Social Links</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Followers</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Category</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Pricing</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Contact Info</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Notes</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/70">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(inf => (
              <TableRow key={inf.id} className="hover:bg-muted/20 border-b border-border/40">
                {/* Influencer */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    {inf.profile_photo ? (
                      <img src={inf.profile_photo} alt={inf.full_name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {inf.full_name?.[0]?.toUpperCase() || 'I'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold leading-tight">{inf.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">@{inf.username || 'n/a'}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-sm border border-green-100">
                        {inf.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Social Links */}
                <TableCell>
                  <div className="flex gap-2">
                    {inf.instagram && (
                      <a href={inf.instagram} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    )}
                    {inf.youtube && (
                      <a href={inf.youtube} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                    {!inf.instagram && !inf.youtube && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>

                {/* Followers */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users className="w-3 h-3 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{(inf.followers || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell>
                  {inf.category ? (
                    <Badge className="bg-orange-50 text-orange-600 border border-orange-200 text-[11px] gap-1 font-medium">
                      <span>{categoryIcons[inf.category] || '📌'}</span> {inf.category}
                    </Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>

                {/* Pricing */}
                <TableCell>
                  <p className="text-sm font-bold text-foreground">₹{(inf.pricing || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted-foreground">Per Post</p>
                </TableCell>

                {/* Contact Info */}
                <TableCell>
                  <div className="space-y-1">
                    {inf.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 text-muted-foreground/60" />
                        <span>{inf.phone}</span>
                      </div>
                    )}
                    {inf.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3 text-muted-foreground/60" />
                        <span>{inf.email}</span>
                      </div>
                    )}
                    {!inf.phone && !inf.email && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>

                {/* Notes */}
                <TableCell className="max-w-[130px]">
                  <p className="text-xs text-muted-foreground line-clamp-2">{inf.notes || '—'}</p>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-500 border-orange-300 hover:bg-orange-50 text-xs h-7 px-3"
                      onClick={() => setViewing(inf)}
                    >
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(inf)}>
                          <Pencil className="w-3 h-3 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(inf.id)} className="text-red-500">
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No influencers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {allFiltered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, allFiltered.length)} to {Math.min(page * ITEMS_PER_PAGE, allFiltered.length)} of {allFiltered.length} results</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ‹
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="icon"
                className={`h-7 w-7 text-xs ${p === page ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
              ›
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Influencer Profile</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {viewing.profile_photo ? (
                  <img src={viewing.profile_photo} alt={viewing.full_name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold">{viewing.full_name?.[0]}</div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{viewing.full_name}</h3>
                  <p className="text-sm text-muted-foreground">@{viewing.username || 'N/A'} • {viewing.city}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Category</span><p className="font-medium">{viewing.category || '-'}</p></div>
                <div><span className="text-muted-foreground text-xs">Followers</span><p className="font-medium">{(viewing.followers || 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Pricing</span><p className="font-medium text-orange-500">₹{(viewing.pricing || 0).toLocaleString('en-IN')}</p></div>
                <div><span className="text-muted-foreground text-xs">Engagement Rate</span><p className="font-medium">{viewing.engagement_rate || 0}%</p></div>
                <div><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium">{viewing.phone || '-'}</p></div>
                <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium">{viewing.email || '-'}</p></div>
              </div>
              {viewing.notes && <div><span className="text-muted-foreground text-xs">Notes</span><p className="text-sm mt-1">{viewing.notes}</p></div>}
              <div className="flex gap-2">
                {viewing.instagram && <a href={viewing.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 underline">Instagram</a>}
                {viewing.youtube && <a href={viewing.youtube} target="_blank" rel="noopener noreferrer" className="text-xs text-red-500 underline">YouTube</a>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <button onClick={closeDialog} className="p-1 rounded-md hover:bg-muted transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <DialogTitle>{editing ? 'Edit Influencer' : 'Add Influencer'}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label className="text-xs">Username</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="@username" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">City *</Label>
                <Select value={form.city} onValueChange={v => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Followers</Label><Input type="number" value={form.followers} onChange={e => setForm({ ...form, followers: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Pricing (₹ per post)</Label><Input type="number" value={form.pricing} onChange={e => setForm({ ...form, pricing: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Instagram URL</Label><Input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} /></div>
              <div><Label className="text-xs">YouTube URL</Label><Input value={form.youtube} onChange={e => setForm({ ...form, youtube: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Niche</Label><Input value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })} /></div>
              <div><Label className="text-xs">Engagement Rate %</Label><Input type="number" value={form.engagement_rate} onChange={e => setForm({ ...form, engagement_rate: Number(e.target.value) })} /></div>
            </div>
            <div><Label className="text-xs">Profile Photo URL</Label><Input value={form.profile_photo || ''} onChange={e => setForm({ ...form, profile_photo: e.target.value })} placeholder="https://..." /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <Button onClick={handleSave} disabled={!form.full_name || !form.city || createMutation.isPending || updateMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {editing ? 'Update Influencer' : 'Add Influencer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Influencer</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}