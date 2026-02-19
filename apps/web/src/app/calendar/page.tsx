'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { UI_COPY } from '@/config/uiCopy';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarItem, CalendarItemType } from '@/domain/types/calendar';
import { CalendarMonthGrid } from '@/components/calendar/CalendarMonthGrid';
import {
  addDays,
  buildMonthDays,
  formatDateKey,
  getMonthRange,
  groupCalendarItemsByDay,
  startOfToday,
} from '@/domain/mappers/calendar';

type RangeDays = 30 | 60 | 90;

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 30, label: UI_COPY.calendar.rangeOptions.thirty },
  { value: 60, label: UI_COPY.calendar.rangeOptions.sixty },
  { value: 90, label: UI_COPY.calendar.rangeOptions.ninety },
];

const minDate = (a: Date, b: Date): Date => (a.getTime() <= b.getTime() ? a : b);
const maxDate = (a: Date, b: Date): Date => (a.getTime() >= b.getTime() ? a : b);

export default function CalendarPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();
  const { items, loading, error, fetchCalendar } = useCalendar(authFetch, isAuthenticated);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [typeFilter, setTypeFilter] = useState<CalendarItemType | 'all'>('all');

  const monthRange = useMemo(() => getMonthRange(currentMonth), [currentMonth]);
  const rangeStart = useMemo(() => startOfToday(), []);
  const rangeEnd = useMemo(() => addDays(rangeStart, rangeDays - 1), [rangeStart, rangeDays]);
  const requestFrom = useMemo(() => minDate(monthRange.from, rangeStart), [monthRange.from, rangeStart]);
  const requestTo = useMemo(() => maxDate(monthRange.to, rangeEnd), [monthRange.to, rangeEnd]);

  useEffect(() => {
    fetchCalendar(formatDateKey(requestFrom), formatDateKey(requestTo));
  }, [fetchCalendar, requestFrom, requestTo]);

  const days = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const availableTypes = useMemo(() => {
    const set = new Set<CalendarItemType>();
    items.forEach((item) => set.add(item.type));
    return Array.from(set);
  }, [items]);

  const resolvedTypeFilter = useMemo<CalendarItemType | 'all'>(() => {
    return typeFilter !== 'all' && !availableTypes.includes(typeFilter) ? 'all' : typeFilter;
  }, [availableTypes, typeFilter]);

  const filteredItems = useMemo(() => {
    if (resolvedTypeFilter === 'all') return items;
    return items.filter((item) => item.type === resolvedTypeFilter);
  }, [items, resolvedTypeFilter]);

  const itemsByDay = useMemo(() => groupCalendarItemsByDay(filteredItems), [filteredItems]);

  const upcomingItems = useMemo(() => {
    return filteredItems.filter((item) => {
      const date = new Date(item.scheduledAt);
      return date >= rangeStart && date <= rangeEnd;
    });
  }, [filteredItems, rangeStart, rangeEnd]);

  const handleItemClick = (item: CalendarItem) => {
    router.push(item.route);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
          <motion.div
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <BackToDashboard />
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center text-yellow-400">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <h2 className="text-4xl font-semibold text-white">{UI_COPY.calendar.title}</h2>
              </div>
              <p className="text-slate-300">{UI_COPY.calendar.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">{UI_COPY.calendar.filterLabel}</span>
                <select
                  value={resolvedTypeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as CalendarItemType | 'all')}
                  disabled={availableTypes.length <= 1}
                  className="text-xs bg-gray-900/60 text-slate-200 border border-gray-800 rounded px-2 py-1"
                >
                  <option value="all">{UI_COPY.calendar.filterAll}</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {UI_COPY.calendar.typeLabels[type] ?? type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">{UI_COPY.calendar.rangeLabel}</span>
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRangeDays(option.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      rangeDays === option.value
                        ? 'bg-yellow-400 text-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="text-slate-300 hover:text-yellow-400"
                  aria-label={UI_COPY.calendar.controls.previousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-300">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="text-slate-300 hover:text-yellow-400"
                  aria-label={UI_COPY.calendar.controls.nextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="surface-card glow-hover p-6 text-center text-red-400">{error}</div>
          ) : (
            <div className="space-y-8">
              <CalendarMonthGrid days={days} itemsByDay={itemsByDay} onItemClick={handleItemClick} />

              <section className="surface-card glow-hover p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{UI_COPY.calendar.upcomingTitle}</h3>
                  <span className="text-xs text-slate-400">{rangeDays} {UI_COPY.calendar.dayLabel}</span>
                </div>
                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-slate-400">{UI_COPY.calendar.emptyDescription}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcomingItems.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 px-4 py-3 text-left hover:border-yellow-500/40"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(item.scheduledAt).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                        </div>
                        <span className="text-xs text-yellow-400">{UI_COPY.calendar.typeLabels[item.type] ?? item.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
