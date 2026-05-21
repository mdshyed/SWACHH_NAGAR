import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../config/axios';
import Spinner from '../../components/common/Spinner';

const CATEGORIES = [
  { value: 'garbage_dumping', label: '🗑️ Garbage Dumping' },
  { value: 'overflowing_bin', label: '♻️ Overflowing Bin' },
  { value: 'road_dirt', label: '🚧 Road Dirt' },
  { value: 'drainage_overflow', label: '💧 Drainage Overflow' },
  { value: 'dead_animal', label: '🐾 Dead Animal' },
  { value: 'construction_debris', label: '🏗️ Construction Debris' },
  { value: 'water_logging', label: '🌊 Water Logging' },
  { value: 'other', label: '📌 Other' },
];

const STEPS = ['Location', 'Details', 'Photo', 'Review'];

const ReportComplaintPage = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [wards, setWards] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: searchParams.get('category') || '',
    ward: '',
    location: { lat: '', lng: '', address: '', landmark: '', pincode: '' },
    isAnonymous: false,
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef();
  const { success, error } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/wards').then((r) => setWards(r.data.data || [])).catch(() => {});
  }, []);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setForm((f) => ({ ...f, location: { ...f.location, lat: lat.toString(), lng: lng.toString(), address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` } }));
        setLocating(false);
      },
      () => { error('Could not detect location. Please enter manually.'); setLocating(false); }
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('isAnonymous', form.isAnonymous);
      if (form.ward) formData.append('ward', form.ward);
      formData.append('location[lat]', form.location.lat);
      formData.append('location[lng]', form.location.lng);
      formData.append('location[address]', form.location.address);
      formData.append('location[landmark]', form.location.landmark);
      formData.append('location[pincode]', form.location.pincode);
      images.forEach((img) => formData.append('images', img));

      const res = await api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      success('Complaint submitted successfully! You earned 10 points 🎉');
      navigate(`/complaints/${res.data.data._id}`);
    } catch (err) {
      error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.location.lat && form.location.lng;
    if (step === 1) return form.title.length >= 10 && form.description.length >= 20 && form.category;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report an Issue</h1>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-gray-200 text-gray-600'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${i === step ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {/* Step 0: Location */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Where is the issue?</h2>
              <button type="button" onClick={detectLocation} disabled={locating} className="btn-secondary w-full">
                {locating ? <><Spinner size="sm" /> Detecting...</> : '📍 Auto-detect My Location'}
              </button>
              <div className="text-center text-sm text-gray-500">— or enter manually —</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Latitude *</label><input className="input" placeholder="19.0760" value={form.location.lat} onChange={(e) => setForm(f => ({ ...f, location: { ...f.location, lat: e.target.value } }))} /></div>
                <div><label className="label">Longitude *</label><input className="input" placeholder="72.8777" value={form.location.lng} onChange={(e) => setForm(f => ({ ...f, location: { ...f.location, lng: e.target.value } }))} /></div>
              </div>
              <div><label className="label">Address</label><input className="input" placeholder="Street/Area name" value={form.location.address} onChange={(e) => setForm(f => ({ ...f, location: { ...f.location, address: e.target.value } }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Landmark</label><input className="input" placeholder="Near XYZ" value={form.location.landmark} onChange={(e) => setForm(f => ({ ...f, location: { ...f.location, landmark: e.target.value } }))} /></div>
                <div><label className="label">Pincode</label><input className="input" placeholder="400001" value={form.location.pincode} onChange={(e) => setForm(f => ({ ...f, location: { ...f.location, pincode: e.target.value } }))} /></div>
              </div>
              {form.location.lat && <div className="text-xs text-green-600 flex items-center gap-1">✅ Location set: {form.location.lat}, {form.location.lng}</div>}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Describe the issue</h2>
              <div>
                <label className="label">Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value} type="button" onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`p-2 text-sm border rounded-lg text-left transition-colors ${form.category === cat.value ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' : 'border-gray-200 hover:border-gray-300'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Title * <span className="text-gray-400 font-normal">({form.title.length}/120)</span></label>
                <input className="input" placeholder="Brief title describing the issue (min 10 chars)" maxLength={120}
                  value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description * <span className="text-gray-400 font-normal">({form.description.length}/1000)</span></label>
                <textarea className="input resize-none" rows={4} placeholder="Detailed description of the problem (min 20 chars)" maxLength={1000}
                  value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {wards.length > 0 && (
                <div>
                  <label className="label">Ward / Area <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select className="input" value={form.ward} onChange={(e) => setForm(f => ({ ...f, ward: e.target.value }))}>
                    <option value="">Select your ward...</option>
                    {wards.map((w) => (
                      <option key={w._id} value={w._id}>{w.wardName?.en || `Ward ${w.wardNumber}`}{w.zone ? ` (Zone ${w.zone})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" checked={form.isAnonymous} onChange={(e) => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} />
                <span className="text-sm text-gray-700">Submit anonymously</span>
              </label>
            </div>
          )}

          {/* Step 2: Photo */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload Photos</h2>
              <p className="text-sm text-gray-500">Add up to 5 photos as evidence. Our AI will verify the images.</p>
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-sm font-medium text-gray-700">Click to upload images</p>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP • Max 5MB each • Up to 5 files</p>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => { setImages(imgs => imgs.filter((_, j) => j !== i)); setPreviews(ps => ps.filter((_, j) => j !== i)); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Category:</span><span className="text-sm font-medium">{CATEGORIES.find(c => c.value === form.category)?.label}</span></div>
                <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Title:</span><span className="text-sm font-medium">{form.title}</span></div>
                <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Location:</span><span className="text-sm font-medium">{form.location.address || `${form.location.lat}, ${form.location.lng}`}</span></div>
                <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Photos:</span><span className="text-sm font-medium">{images.length} attached</span></div>
                <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Points:</span><span className="text-sm font-semibold text-primary-600">+10 points</span></div>
              </div>
              <p className="text-xs text-gray-500">By submitting, you confirm this is a genuine civic issue and the images are accurate.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary" >← Back</button>
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary">Next →</button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                {loading ? <><Spinner size="sm" /> Submitting...</> : '🚀 Submit Complaint'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportComplaintPage;
