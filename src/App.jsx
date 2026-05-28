import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'

// ─── LANDING ────────────────────────────────────────────────────────────────
function LandingPage({ onLogin, onSignup }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-white mb-3">CampusRide 🚗</h1>
        <p className="text-blue-100 text-lg">Rides by students, for students.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
        <p className="text-gray-500 mb-6 text-sm">Get a ride or offer one — completely free.</p>
        <button onClick={onLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold mb-3 hover:bg-blue-700 transition">Login</button>
        <button onClick={onSignup} className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition">Sign Up</button>
      </div>
      <p className="text-blue-200 text-xs mt-6">Made for students. Powered by kindness. 💙</p>
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginPage({ onBack, onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Please fill all fields.'); return }
    setLoading(true); setError('')
    try {
      const userCred = await signInWithEmailAndPassword(auth, form.email, form.password)
      const snap = await getDoc(doc(db, 'users', userCred.user.uid))
      if (snap.exists()) onSuccess(snap.data())
    } catch (err) { setError('Invalid email or password.') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <button onClick={onBack} className="text-blue-500 text-sm mb-4 hover:underline">← Back</button>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back!</h2>
        <p className="text-gray-500 text-sm mb-6">Sign in to CampusRide 🚗</p>
        <input type="email" placeholder="College Email" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-blue-400" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </div>
    </div>
  )
}

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
function SignupPage({ onBack, onSuccess }) {
  const [role, setRole] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password || !role) { setError('Please fill all fields and select a role.'); return }
    setLoading(true); setError('')
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await setDoc(doc(db, 'users', userCred.user.uid), { name: form.name, email: form.email, role, createdAt: new Date() })
      onSuccess({ name: form.name, role })
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <button onClick={onBack} className="text-blue-500 text-sm mb-4 hover:underline">← Back</button>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
        <p className="text-gray-500 text-sm mb-6">Join CampusRide today 🚗</p>
        <input type="text" placeholder="Full Name" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input type="email" placeholder="College Email" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-blue-400" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <p className="text-sm font-semibold text-gray-700 mb-3">I want to join as:</p>
        <div className="flex gap-3 mb-5">
          <button onClick={() => setRole('rider')} className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition ${role === 'rider' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>🚗 Rider</button>
          <button onClick={() => setRole('customer')} className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition ${role === 'customer' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-400'}`}>🙋 Customer</button>
        </div>
        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
        <button onClick={handleSignup} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}

// ─── RIDER DASHBOARD ─────────────────────────────────────────────────────────
function RiderDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('post')
  const [form, setForm] = useState({ from: '', to: '', time: '', seats: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requests, setRequests] = useState([])

  const postRide = async () => {
    if (!form.from || !form.to || !form.time || !form.seats) return
    setLoading(true)
    await addDoc(collection(db, 'rides'), {
      riderName: user.name,
      riderEmail: user.email,
      from: form.from,
      to: form.to,
      time: form.time,
      seats: parseInt(form.seats),
      createdAt: serverTimestamp()
    })
    setForm({ from: '', to: '', time: '', seats: '' })
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const fetchRequests = async () => {
    const q = query(collection(db, 'requests'))
    const snap = await getDocs(q)
    setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { if (tab === 'requests') fetchRequests() }, [tab])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">CampusRide 🚗</h1>
          <p className="text-blue-200 text-xs">Hey, {user.name}!</p>
        </div>
        <button onClick={onLogout} className="text-blue-200 text-xs hover:text-white transition">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button onClick={() => setTab('post')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'post' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Post a Ride</button>
        <button onClick={() => setTab('requests')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Ride Requests</button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {tab === 'post' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Post Today's Ride 🗺️</h2>
            <input type="text" placeholder="Starting point (e.g. Miyapur)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} />
            <input type="text" placeholder="Destination (e.g. JNTU)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} />
            <input type="time" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            <input type="number" placeholder="Available seats (e.g. 2)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-blue-400" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
            {success && <p className="text-green-500 text-sm mb-3 text-center">✅ Ride posted successfully!</p>}
            <button onClick={postRide} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Ride'}
            </button>
          </div>
        )}

        {tab === 'requests' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Student Ride Requests 🙋</h2>
            {requests.length === 0
              ? <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">No requests yet. Check back later!</div>
              : requests.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow p-5 mb-3">
                  <p className="font-semibold text-gray-800">{r.studentName}</p>
                  <p className="text-sm text-gray-500 mt-1">📍 Pickup: {r.pickup}</p>
                  <p className="text-sm text-gray-500">🏁 Drop: {r.drop}</p>
                  <p className="text-sm text-gray-500">🕐 Time: {r.time}</p>
                  <p className="text-xs text-gray-400 mt-2">{r.note}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CUSTOMER DASHBOARD ───────────────────────────────────────────────────────
function CustomerDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('rides')
  const [rides, setRides] = useState([])
  const [form, setForm] = useState({ pickup: '', drop: '', time: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const fetchRides = async () => {
    const snap = await getDocs(collection(db, 'rides'))
    setRides(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const postRequest = async () => {
    if (!form.pickup || !form.drop || !form.time) return
    setLoading(true)
    await addDoc(collection(db, 'requests'), {
      studentName: user.name,
      studentEmail: user.email,
      pickup: form.pickup,
      drop: form.drop,
      time: form.time,
      note: form.note,
      createdAt: serverTimestamp()
    })
    setForm({ pickup: '', drop: '', time: '', note: '' })
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  useEffect(() => { if (tab === 'rides') fetchRides() }, [tab])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">CampusRide 🙋</h1>
          <p className="text-indigo-200 text-xs">Hey, {user.name}!</p>
        </div>
        <button onClick={onLogout} className="text-indigo-200 text-xs hover:text-white transition">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button onClick={() => setTab('rides')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'rides' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Available Rides</button>
        <button onClick={() => setTab('request')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'request' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Request a Ride</button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {tab === 'rides' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Available Rides 🚗</h2>
            {rides.length === 0
              ? <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">No rides posted yet. Check back soon!</div>
              : rides.map(r => (
                <div key={r.id} className="bg-white rounded-2xl shadow p-5 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800">{r.riderName}</p>
                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">{r.seats} seats</span>
                  </div>
                  <p className="text-sm text-gray-500">📍 From: {r.from}</p>
                  <p className="text-sm text-gray-500">🏁 To: {r.to}</p>
                  <p className="text-sm text-gray-500">🕐 Time: {r.time}</p>
                  <button className="mt-3 w-full border-2 border-indigo-500 text-indigo-500 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition">
                    Contact Rider
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'request' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Request a Ride 🙋</h2>
            <input type="text" placeholder="Pickup location" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-indigo-400" value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })} />
            <input type="text" placeholder="Drop location (e.g. College)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-indigo-400" value={form.drop} onChange={e => setForm({ ...form, drop: e.target.value })} />
            <input type="time" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-indigo-400" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            <textarea placeholder="Any note for the rider? (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-indigo-400 resize-none" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            {success && <p className="text-green-500 text-sm mb-3 text-center">✅ Request posted successfully!</p>}
            <button onClick={postRequest} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Request'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) { setUser(snap.data()); setPage('dashboard') }
      } else { setUser(null); setPage('landing') }
    })
    return () => unsub()
  }, [])

  const handleLogout = async () => { await signOut(auth) }

  return (
    <>
      {page === 'landing' && <LandingPage onLogin={() => setPage('login')} onSignup={() => setPage('signup')} />}
      {page === 'login' && <LoginPage onBack={() => setPage('landing')} onSuccess={(u) => { setUser(u); setPage('dashboard') }} />}
      {page === 'signup' && <SignupPage onBack={() => setPage('landing')} onSuccess={(u) => { setUser(u); setPage('dashboard') }} />}
      {page === 'dashboard' && user?.role === 'rider' && <RiderDashboard user={user} onLogout={handleLogout} />}
      {page === 'dashboard' && user?.role === 'customer' && <CustomerDashboard user={user} onLogout={handleLogout} />}
    </>
  )
}

export default App