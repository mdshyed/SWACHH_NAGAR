import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

const GarbageSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/schedules'), api.get('/schedules/today')])
      .then(([all, today]) => { setSchedules(all.data.data || []); setTodaySchedules(today.data.data || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Garbage Collection Schedule</h1>
        <p className="text-gray-500 text-sm mb-6">Find collection timings for your area</p>

        {/* Today's collections */}
        {todaySchedules.length > 0 && (
          <div className="card bg-green-50 border-green-200 mb-6">
            <h2 className="font-semibold text-green-800 mb-3">🚛 Today's Collections</h2>
            <div className="space-y-2">
              {todaySchedules.map((s) => (
                <div key={s._id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-green-900">{s.ward?.wardName?.en || 'Ward ' + s.ward?.wardNumber}</span>
                  <span className="text-green-700">{s.timeSlot?.start} – {s.timeSlot?.end}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
          <div className="grid sm:grid-cols-2 gap-4">
            {schedules.map((s) => (
              <div key={s._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.ward?.wardName?.en || 'Ward'} {s.ward?.wardNumber}</h3>
                    <p className="text-sm text-gray-500">{s.timeSlot?.start} – {s.timeSlot?.end}</p>
                  </div>
                  <span className="text-2xl">🚛</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.collectionDays?.map((day) => (
                    <span key={day} className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{DAY_FULL[day] || day}</span>
                  ))}
                </div>
                {s.notes?.en && <p className="text-xs text-gray-500 mt-2">{s.notes.en}</p>}
              </div>
            ))}
            {schedules.length === 0 && (
              <div className="sm:col-span-2 card text-center py-12">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="text-gray-500">No schedules available yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GarbageSchedulePage;
