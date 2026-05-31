import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, serverTimestamp, deleteDoc } from 'firebase/firestore'

async function cleanOldEntries() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const ridesSnap = await getDocs(collection(db, 'rides'))
  ridesSnap.forEach(async (d) => {
    const data = d.data()
    if (data.createdAt && data.createdAt.toDate() < cutoff) await deleteDoc(doc(db, 'rides', d.id))
  })
  const reqSnap = await getDocs(collection(db, 'requests'))
  reqSnap.forEach(async (d) => {
    const data = d.data()
    if (data.createdAt && data.createdAt.toDate() < cutoff) await deleteDoc(doc(db, 'requests', d.id))
  })
}

async function getAverageRating(email) {
  const snap = await getDocs(collection(db, 'ratings'))
  const userRatings = snap.docs.filter(d => d.data().toEmail === email).map(d => d.data().stars)
  if (userRatings.length === 0) return null
  const avg = userRatings.reduce((a, b) => a + b, 0) / userRatings.length
  return avg.toFixed(1)
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1 mb-4">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onClick={() => onChange(s)} className={`text-2xl transition ${s <= value ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
      ))}
    </div>
  )
}

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
        <button onClick={onBack} className="text-blue-500 text-sm mb-4 hover:underline">Back</button>
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
        <button onClick={onBack} className="text-blue-500 text-sm mb-4 hover:underline">Back</button>
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

function RateTab({ user }) {
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState(null)
  const [stars, setStars] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map(d => d.data()).filter(u => u.email !== user.email))
    }
    fetchUsers()
  }, [])

  const submitRating = async () => {
    if (!selected || stars === 0) { setError('Please select a person and give a star rating.'); return }
    setLoading(true); setError('')
    await addDoc(collection(db, 'ratings'), {
      fromEmail: user.email,
      fromName: user.name,
      toEmail: selected.email,
      toName: selected.name,
      stars,
      review,
      createdAt: serverTimestamp()
    })
    setSelected(null); setStars(0); setReview(''); setSuccess(true); setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Rate Someone ⭐</h2>
        <p className="text-gray-400 text-xs mb-5">Rate a rider or fellow student after your ride</p>

        <p className="text-sm font-semibold text-gray-700 mb-2">Select person:</p>
        <div className="max-h-40 overflow-y-auto mb-5 border border-gray-100 rounded-xl">
          {users.map(u => (
            <button
              key={u.email}
              onClick={() => setSelected(u)}
              className={`w-full text-left px-4 py-3 text-sm transition border-b border-gray-50 last:border-0 ${selected?.email === u.email ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {u.name} <span className="text-xs text-gray-400">({u.role})</span>
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Your rating:</p>
        <StarPicker value={stars} onChange={setStars} />

        <textarea
          placeholder="Write a short review (optional)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-blue-400 resize-none"
          rows={3}
          value={review}
          onChange={e => setReview(e.target.value)}
        />

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-3 text-center">Rating submitted! 🎉</p>}

        <button onClick={submitRating} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  )
}

function RiderDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('post')
  const [form, setForm] = useState({ from: '', to: '', time: '', seats: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [requests, setRequests] = useState([])
  const [myRides, setMyRides] = useState([])
  const [myRating, setMyRating] = useState(null)

  useEffect(() => {
    getAverageRating(user.email).then(setMyRating)
  }, [])

  const postRide = async () => {
    if (!form.from || !form.to || !form.time || !form.seats || !form.phone) return
    setLoading(true)
    await addDoc(collection(db, 'rides'), {
      riderName: user.name,
      riderEmail: user.email,
      from: form.from,
      to: form.to,
      time: form.time,
      seats: parseInt(form.seats),
      phone: form.phone,
      createdAt: serverTimestamp()
    })
    setForm({ from: '', to: '', time: '', seats: '', phone: '' })
    setSuccess(true); setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
    fetchMyRides()
  }

  const fetchMyRides = async () => {
    const snap = await getDocs(collection(db, 'rides'))
    setMyRides(snap.docs.filter(d => d.data().riderEmail === user.email).map(d => ({ id: d.id, ...d.data() })))
  }

  const deleteRide = async (id) => {
    await deleteDoc(doc(db, 'rides', id))
    fetchMyRides()
  }

  const fetchRequests = async () => {
    const snap = await getDocs(collection(db, 'requests'))
    setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => {
    if (tab === 'requests') fetchRequests()
    if (tab === 'post') fetchMyRides()
  }, [tab])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">CampusRide 🚗</h1>
          <p className="text-blue-200 text-xs">Hey, {user.name}! {myRating && <span>⭐ {myRating}</span>}</p>
        </div>
        <button onClick={onLogout} className="text-blue-200 text-xs hover:text-white transition">Logout</button>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        <button onClick={() => setTab('post')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'post' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Post a Ride</button>
        <button onClick={() => setTab('requests')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Requests</button>
        <button onClick={() => setTab('rate')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'rate' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Rate ⭐</button>
      </div>

      {tab === 'rate' && <RateTab user={user} />}

      {tab !== 'rate' && (
        <div className="px-4 py-6 max-w-lg mx-auto">
          {tab === 'post' && (
            <div>
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Post Today's Ride 🗺️</h2>
                <input type="text" placeholder="Starting point (e.g. Miyapur)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} />
                <input type="text" placeholder="Destination (e.g. College)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} />
                <input type="time" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                <input type="number" placeholder="Available seats (e.g. 2)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-blue-400" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
                <input type="tel" placeholder="Your WhatsApp number (e.g. 9876543210)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-blue-400" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                {success && <p className="text-green-500 text-sm mb-3 text-center">Ride posted successfully!</p>}
                <button onClick={postRide} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Posting...' : 'Post Ride'}
                </button>
              </div>
              {myRides.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Your Active Rides</h2>
                  {myRides.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl shadow p-5 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-800">{r.from} → {r.to}</p>
                        <button onClick={() => deleteRide(r.id)} className="text-red-400 text-xs hover:text-red-600 transition">🗑️ Delete</button>
                      </div>
                      <p className="text-sm text-gray-500">🕐 {r.time} &nbsp;|&nbsp; 💺 {r.seats} seats</p>
                    </div>
                  ))}
                </div>
              )}
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
      )}
    </div>
  )
}

function CustomerDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('rides')
  const [rides, setRides] = useState([])
  const [form, setForm] = useState({ pickup: '', drop: '', time: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  const [myRating, setMyRating] = useState(null)

  useEffect(() => {
    getAverageRating(user.email).then(setMyRating)
  }, [])

  const fetchRides = async () => {
    const snap = await getDocs(collection(db, 'rides'))
    const ridesData = await Promise.all(snap.docs.map(async d => {
      const data = d.data()
      const avg = await getAverageRating(data.riderEmail)
      return { id: d.id, ...data, avgRating: avg }
    }))
    setRides(ridesData)
  }

  const fetchMyRequests = async () => {
    const snap = await getDocs(collection(db, 'requests'))
    setMyRequests(snap.docs.filter(d => d.data().studentEmail === user.email).map(d => ({ id: d.id, ...d.data() })))
  }

  const deleteRequest = async (id) => {
    await deleteDoc(doc(db, 'requests', id))
    fetchMyRequests()
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
    setSuccess(true); setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
    fetchMyRequests()
  }

  useEffect(() => {
    if (tab === 'rides') fetchRides()
    if (tab === 'request') fetchMyRequests()
  }, [tab])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg">CampusRide 🙋</h1>
          <p className="text-indigo-200 text-xs">Hey, {user.name}! {myRating && <span>⭐ {myRating}</span>}</p>
        </div>
        <button onClick={onLogout} className="text-indigo-200 text-xs hover:text-white transition">Logout</button>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        <button onClick={() => setTab('rides')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'rides' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Available Rides</button>
        <button onClick={() => setTab('request')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'request' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Request</button>
        <button onClick={() => setTab('rate')} className={`flex-1 py-3 text-sm font-semibold transition ${tab === 'rate' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>Rate ⭐</button>
      </div>

      {tab === 'rate' && <RateTab user={user} />}

      {tab !== 'rate' && (
        <div className="px-4 py-6 max-w-lg mx-auto">
          {tab === 'rides' && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Today's Available Rides 🚗</h2>
              {rides.length === 0
                ? <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">No rides posted yet. Check back soon!</div>
                : rides.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl shadow p-5 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{r.riderName}</p>
                        {r.avgRating && <p className="text-xs text-yellow-500">⭐ {r.avgRating}</p>}
                      </div>
                      <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">{r.seats} seats</span>
                    </div>
                    <p className="text-sm text-gray-500">📍 From: {r.from}</p>
                    <p className="text-sm text-gray-500">🏁 To: {r.to}</p>
                    <p className="text-sm text-gray-500">🕐 Time: {r.time}</p>
                    <a
                      href={`https://wa.me/91${r.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full block text-center border-2 border-green-500 text-green-500 py-2 rounded-xl text-sm font-semibold hover:bg-green-50 transition"
                    >
                      Contact on WhatsApp 💬
                    </a>
                  </div>
                ))
              }
            </div>
          )}

          {tab === 'request' && (
            <div>
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Request a Ride 🙋</h2>
                <input type="text" placeholder="Pickup location" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-indigo-400" value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })} />
                <input type="text" placeholder="Drop location (e.g. College)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-indigo-400" value={form.drop} onChange={e => setForm({ ...form, drop: e.target.value })} />
                <input type="time" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-indigo-400" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                <textarea placeholder="Any note for the rider? (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 text-sm focus:outline-none focus:border-indigo-400 resize-none" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                {success && <p className="text-green-500 text-sm mb-3 text-center">Request posted successfully!</p>}
                <button onClick={postRequest} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? 'Posting...' : 'Post Request'}
                </button>
              </div>
              {myRequests.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Your Active Requests</h2>
                  {myRequests.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl shadow p-5 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-800">{r.pickup} → {r.drop}</p>
                        <button onClick={() => deleteRequest(r.id)} className="text-red-400 text-xs hover:text-red-600 transition">🗑️ Delete</button>
                      </div>
                      <p className="text-sm text-gray-500">🕐 {r.time}</p>
                      {r.note && <p className="text-xs text-gray-400 mt-1">{r.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function App() {
  const [page, setPage] = useState('landing')
  const [user, setUser] = useState(null)

  useEffect(() => {
    cleanOldEntries()
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
