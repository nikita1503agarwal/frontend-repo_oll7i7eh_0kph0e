import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

function useAuth() {
  const tokenKey = 'meetngo_token'
  const [token, setToken] = useState(localStorage.getItem(tokenKey))
  const isAuthed = !!token

  const saveToken = (t) => {
    localStorage.setItem(tokenKey, t)
    setToken(t)
  }
  const logout = () => {
    localStorage.removeItem(tokenKey)
    setToken(null)
  }
  return { token, saveToken, logout, isAuthed }
}

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function AuthView({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed to register')
        const data = await res.json()
        onAuthed(data.access_token)
      } else {
        const form = new URLSearchParams()
        form.append('username', email)
        form.append('password', password)
        const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed to login')
        const data = await res.json()
        onAuthed(data.access_token)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-1">MeetNgo</h1>
        <p className="text-slate-300 mb-6">Secure meetings and recording, simplified.</p>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-lg ${mode==='login' ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/15'}`}>Log in</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-lg ${mode==='signup' ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/15'}`}>Sign up</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode==='signup' && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Name</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} required className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button disabled={loading} className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-70">{loading ? 'Please wait...' : (mode==='login' ? 'Log in' : 'Create account')}</button>
        </form>
      </div>
    </div>
  )
}

function Dashboard({ token, onLogout }) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const authHeader = { Authorization: `Bearer ${token}` }

  const createMeeting = async () => {
    setError('')
    try {
      const res = await fetch(`${API}/meetings`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ title }) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to create meeting')
      const data = await res.json()
      setCode(data.code)
    } catch (e) { setError(e.message) }
  }

  const joinMeeting = async () => {
    try {
      const res = await fetch(`${API}/meetings/join`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify({ code }) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to join')
      navigate(`/room/${code}`)
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <header className="flex items-center justify-between max-w-5xl mx-auto mb-10">
        <h1 className="text-2xl font-semibold">MeetNgo</h1>
        <button onClick={onLogout} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">Log out</button>
      </header>

      <main className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
        <section className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-medium mb-3">Start a new meeting</h2>
          <div className="flex gap-2">
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none"/>
            <button onClick={createMeeting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Create</button>
          </div>
        </section>
        <section className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-lg font-medium mb-3">Join with code</h2>
          <div className="flex gap-2">
            <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} placeholder="AB12CD34" className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 outline-none"/>
            <button onClick={joinMeeting} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500">Join</button>
          </div>
        </section>
        <Recorder token={token} />
      </main>
      {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
    </div>
  )
}

function Recorder() {
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const [recording, setRecording] = useState(false)
  const [chunks, setChunks] = useState([])
  const [stream, setStream] = useState(null)

  useEffect(()=>{
    ;(async()=>{
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      } catch (e) {
        console.error('Media error', e)
      }
    })()
    return ()=>{
      stream?.getTracks().forEach(t=>t.stop())
    }
  },[])

  const start = () => {
    if (!stream) return
    const rec = new MediaRecorder(stream)
    mediaRecorderRef.current = rec
    const localChunks = []
    rec.ondataavailable = e => { if (e.data.size>0) localChunks.push(e.data) }
    rec.onstop = () => {
      setChunks(localChunks)
    }
    rec.start()
    setRecording(true)
  }
  const stop = () => { mediaRecorderRef.current?.stop(); setRecording(false) }

  const download = () => {
    if (!chunks.length) return
    const blob = new Blob(chunks, { type: chunks[0].type || 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recording-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-5 md:col-span-2">
      <h2 className="text-lg font-medium mb-3">Record from your device</h2>
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black/50 aspect-video" />
      <div className="flex gap-2 mt-3">
        {!recording ? (
          <button onClick={start} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Start recording</button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500">Stop</button>
        )}
        <button onClick={download} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">Download</button>
      </div>
    </section>
  )
}

function Room() {
  const { code } = (()=>{
    const path = window.location.pathname
    const match = path.match(/\/room\/(.+)$/)
    return { code: match ? match[1] : '' }
  })()

  const videoLocal = useRef(null)
  const videoRemote = useRef(null)
  const pcRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(()=>{
    const ws = new WebSocket((API.replace('http','ws'))+`/ws/${code}`)
    wsRef.current = ws
    ws.onmessage = async (evt)=>{
      const msg = JSON.parse(evt.data)
      if (msg.type === 'offer') {
        await pcRef.current.setRemoteDescription(msg)
        const ans = await pcRef.current.createAnswer()
        await pcRef.current.setLocalDescription(ans)
        ws.send(JSON.stringify(ans))
      } else if (msg.type === 'answer') {
        await pcRef.current.setRemoteDescription(msg)
      } else if (msg.type === 'candidate') {
        try { await pcRef.current.addIceCandidate(msg.candidate) } catch {}
      }
    }

    ;(async()=>{
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pcRef.current = pc
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoLocal.current) videoLocal.current.srcObject = stream
      stream.getTracks().forEach(t=>pc.addTrack(t, stream))
      pc.ontrack = (e)=>{
        if (videoRemote.current) videoRemote.current.srcObject = e.streams[0]
      }
      pc.onicecandidate = (e)=>{
        if (e.candidate) ws.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }))
      }
    })()

    return ()=>{ ws.close(); pcRef.current?.close() }
  },[code])

  const call = async ()=>{
    const offer = await pcRef.current.createOffer()
    await pcRef.current.setLocalDescription(offer)
    wsRef.current?.send(JSON.stringify(offer))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Room {code}</h1>
          <Link to="/" className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15">Leave</Link>
        </header>
        <div className="grid md:grid-cols-2 gap-4">
          <video ref={videoLocal} autoPlay playsInline muted className="w-full rounded-lg bg-black/50 aspect-video" />
          <video ref={videoRemote} autoPlay playsInline className="w-full rounded-lg bg-black/50 aspect-video" />
        </div>
        <div className="mt-4">
          <button onClick={call} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Start Call</button>
        </div>
      </div>
    </div>
  )
}

export default function AppRoot() {
  const auth = useAuth()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={auth.isAuthed ? <Dashboard token={auth.token} onLogout={auth.logout} /> : <AuthView onAuthed={auth.saveToken} />} />
        <Route path="/room/:code" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}
