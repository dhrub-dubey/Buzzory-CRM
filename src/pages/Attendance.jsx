import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, addMonths, eachDayOfInterval } from 'date-fns';
import { CalendarCheck, ChevronLeft, ChevronRight, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import MarkAttendanceDialog from '@/components/attendance/MarkAttendanceDialog';
import AddEmployeeDialog from '@/components/attendance/AddEmployeeDialog';
import DeleteEmployeeDialog from '@/components/attendance/DeleteEmployeeDialog';

const ADMIN_EMAIL = 'buzzory.it@gmail.com';

export default function Attendance() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [cell, setCell] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const monthStart = format(cursor, 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(cursor), 'yyyy-MM-dd');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const canMark = !!me && (me.email === ADMIN_EMAIL || me.role === 'admin' || me.role === 'board_member');

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['attendance-employees'],
    queryFn: async () => {
      const res = await base44.entities.AttendanceEmployee.list('full_name', 200);
      const list = Array.isArray(res) ? res : res.items;
      return list.filter(e => e.status !== 'inactive');
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ['attendance-records', monthStart, monthEnd],
    queryFn: async () => {
      const res = await base44.entities.AttendanceRecord.filter(
        { date: { $gte: monthStart, $lte: monthEnd } },
        { limit: 2000 }
      );
      return Array.isArray(res) ? res : res.items;
    },
  });

  const days = useMemo(() => eachDayOfInterval({ start: cursor, end: endOfMonth(cursor) }), [cursor]);
  const recordMap = useMemo(() => {
    const map = {};
    records.forEach(r => { map[`${r.employee_id}|${r.date}`] = r; });
    return map;
  }, [records]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, leave: 0 };
    employees.forEach(e => {
      const rec = recordMap[`${e.id}|${todayKey}`];
      if (rec?.status) counts[rec.status] += 1;
    });
    return counts;
  }, [employees, recordMap, todayKey]);

  const markMutation = useMutation({
    mutationFn: async ({ employee, date, status }) => {
      const existing = recordMap[`${employee.id}|${date}`];
      if (existing && !status) return base44.entities.AttendanceRecord.delete(existing.id);
      if (existing) return base44.entities.AttendanceRecord.update(existing.id, { status, marked_by: me?.full_name });
      if (!status) return null;
      return base44.entities.AttendanceRecord.create({
        employee_id: employee.id,
        employee_name: employee.full_name,
        date,
        status,
        marked_by: me?.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      setCell(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (employee) => {
      await base44.entities.AttendanceRecord.deleteMany({ employee_id: employee.id });
      await base44.entities.AttendanceEmployee.delete(employee.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-employees'] });
      setDeleteTarget(null);
    },
  });

  const currentStatus = cell ? recordMap[`${cell.employee.id}|${cell.date}`]?.status : null;

  return (
    <div>
      <PageHeader icon={CalendarCheck} title="Attendance" subtitle="Mark and view your team's monthly attendance">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-semibold text-foreground w-36 text-center whitespace-nowrap">{format(cursor, 'MMMM yyyy')}</span>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </PageHeader>

      <AttendanceStats counts={todayCounts} total={employees.length} />

      {!loadingEmployees && employees.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No employees yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Add your team members to start marking attendance.</p>
          {canMark && (
            <Button onClick={() => setShowAdd(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <UserPlus className="w-4 h-4" /> Add Employee
            </Button>
          )}
        </div>
      ) : (
        <AttendanceTable
          employees={employees}
          days={days}
          recordMap={recordMap}
          canMark={canMark}
          onSelect={(employee, date) => setCell({ employee, date })}
          onDeleteRequest={(employee) => setDeleteTarget(employee)}
        />
      )}

      {canMark && employees.length > 0 && (
        <Button onClick={() => setShowAdd(true)} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <UserPlus className="w-4 h-4" /> Add Employee
        </Button>
      )}

      <MarkAttendanceDialog
        cell={cell}
        current={currentStatus}
        saving={markMutation.isPending}
        onClose={() => setCell(null)}
        onSelect={(status) => cell && markMutation.mutate({ employee: cell.employee, date: cell.date, status })}
      />

      <AddEmployeeDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['attendance-employees'] })}
      />

      <DeleteEmployeeDialog
        employee={deleteTarget}
        deleting={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(employee) => deleteMutation.mutate(employee)}
      />
    </div>
  );
}