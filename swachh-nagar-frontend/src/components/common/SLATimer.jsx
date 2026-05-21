import { useState, useEffect } from 'react';

const SLATimer = ({ deadline, status }) => {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    if (!deadline || status === 'resolved' || status === 'rejected') {
      setDiff(null);
      return;
    }
    const tick = () => setDiff(new Date(deadline) - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, status]);

  if (diff === null) return null;

  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const urgent = !overdue && diff < 3 * 3600000;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
      overdue ? 'bg-red-100 text-red-700 border border-red-200' :
      urgent  ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <span>{overdue ? '⚠️' : '⏱️'}</span>
      <span>
        {overdue ? 'Overdue by ' : 'SLA: '}
        <span className="font-mono font-bold">{pad(h)}h {pad(m)}m {pad(s)}s</span>
        {overdue ? ' ago' : ' left'}
      </span>
    </div>
  );
};

export default SLATimer;
