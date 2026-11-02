
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  eachDayOfInterval,
} from 'date-fns';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import MarkAttendanceDialog from '@/components/attendance/MarkAttendanceDialog';

export default function Attendance() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [cell, setCell] = useState(null);

  const role = profile?.role;
  const canMark = role === 'super_admin' || role === 'board_member';
  const isEmployee = role === 'employee';

  const hasAccess =
    profile?.status === 'approved' &&
    (canMark || isEmployee);

  const monthStart = format(cursor, 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(cursor), 'yyyy-MM-dd');
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  // Employees see only their own profile.
  // Board members and super admins see all approved employees.
  const {
    data: employees = [],
    isLoading: loadingEmployees,
    error: employeesError,
  } = useQuery({
    queryKey: ['attendance-employees', user?.id, role],
    enabled: !!user?.id && hasAccess,
    queryFn: async () => {
      if (isEmployee) {
        return [{
          ...profile,
          id: user.id,
        }];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, avatar_url')
        .eq('role', 'employee')
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;

      return data || [];
    },
  });

  // Fetch attendance records for the selected month.
  // Include today's date too, so the statistics remain correct
  // even when viewing a different month.
  const queryStart = todayKey < monthStart ? todayKey : monthStart;
  const queryEnd = todayKey > monthEnd ? todayKey : monthEnd;

  const {
    data: records = [],
    isLoading: loadingRecords,
    error: recordsError,
  } = useQuery({
    queryKey: [
      'attendance-records',
      queryStart,
      queryEnd,
      user?.id,
      role,
    ],
    enabled: !!user?.id && hasAccess,
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select('*')
        .gte('date', queryStart)
        .lte('date', queryEnd);

      // Additional frontend filtering.
      // RLS independently enforces this restriction in the database.
      if (isEmployee) {
        query = query.eq('employee_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
  });

  const days = useMemo(
    () => eachDayOfInterval({
      start: cursor,
      end: endOfMonth(cursor),
    }),
    [cursor]
  );

  const recordMap = useMemo(() => {
    const map = {};

    records.forEach(record => {
      map[`${record.employee_id}|${record.date}`] = record;
    });

    return map;
  }, [records]);

  const todayCounts = useMemo(() => {
    const counts = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    employees.forEach(employee => {
      const record = recordMap[`${employee.id}|${todayKey}`];

      if (record?.status && counts[record.status] !== undefined) {
        counts[record.status] += 1;
      }
    });

    return counts;
  }, [employees, recordMap, todayKey]);

  const markMutation = useMutation({
    mutationFn: async ({ employee, date, status }) => {
      if (!canMark) {
        throw new Error('You are not authorized to modify attendance.');
      }

      const existing = recordMap[`${employee.id}|${date}`];

      // Clear an existing attendance record.
      if (existing && !status) {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        return;
      }

      // Update an existing record.
      // Do not change marked_by: it identifies the original marker.
      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existing.id);

        if (error) throw error;

        return;
      }

      // Create a new record.
      if (!status) return;

      const { error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date,
          status,
          marked_by: user.id,
        });

      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attendance-records'],
      });

      setCell(null);
    },
  });

  const currentStatus = cell
    ? recordMap[`${cell.employee.id}|${cell.date}`]?.status
    : null;

  if (!hasAccess) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <CalendarCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">
          Attendance access unavailable
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Your account does not have an approved attendance role.
        </p>
      </div>
    );
  }

  if (employeesError || recordsError) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          Unable to load attendance
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {employeesError?.message || recordsError?.message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Attendance"
        subtitle={
          canMark
            ? "Manage your team's monthly attendance"
            : "View your monthly attendance"
        }
      >
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm font-semibold text-foreground w-36 text-center whitespace-nowrap">
            {format(cursor, 'MMMM yyyy')}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      <AttendanceStats
        counts={todayCounts}
        total={employees.length}
      />

      {loadingEmployees || loadingRecords ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Loading attendance...
          </p>
        </div>
      ) : employees.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            No approved employees found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Approved employee profiles will appear here automatically.
          </p>
        </div>
      ) : (
        <AttendanceTable
          employees={employees}
          days={days}
          recordMap={recordMap}
          canMark={canMark}
          onSelect={(employee, date) => {
            if (canMark) {
              setCell({ employee, date });
            }
          }}
        />
      )}

      {canMark && (
        <MarkAttendanceDialog
          cell={cell}
          current={currentStatus}
          saving={markMutation.isPending}
          onClose={() => setCell(null)}
          onSelect={(status) => {
            if (cell) {
              markMutation.mutate({
                employee: cell.employee,
                date: cell.date,
                status,
              });
            }
          }}
        />
      )}

      {markMutation.isError && (
        <p className="text-sm text-red-600 mt-3">
          Failed to save attendance: {markMutation.error.message}
        </p>
      )}
    </div>
  );
}
