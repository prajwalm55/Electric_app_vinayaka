import { useEffect, useState } from 'react'
import { User, Building2, Lock, Save } from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Logo } from '../components/common/Logo'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

export function SettingsPage() {
  const { profile, updateProfile, changePassword, logout } = useAuth()
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    setForm(profile)
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage('')
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMessage('Password updated')
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Could not update password')
    }
  }

  return (
    <div>
      <Header title="Settings" subtitle="Profile & preferences" />

      <form onSubmit={handleSave} className="px-4 lg:px-6 py-4 space-y-4 max-w-2xl">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary-600" />
            <CardTitle>Profile</CardTitle>
          </div>
          <div className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Mobile" type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary-600" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <div className="space-y-4">
            <Input label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <Input label="Location" value={form.companyLocation} onChange={(e) => setForm({ ...form, companyLocation: e.target.value })} />
          </div>
        </Card>

        <Button type="submit" fullWidth size="lg">
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </form>

      <form onSubmit={handlePassword} className="px-4 lg:px-6 pb-4 space-y-4 max-w-2xl">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary-600" />
            <CardTitle>Security</CardTitle>
          </div>
          <div className="space-y-4">
            <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            {passwordMessage && <p className="text-sm text-slate-600">{passwordMessage}</p>}
            <Button type="submit" variant="outline" fullWidth>Update Password</Button>
          </div>
        </Card>

        <Button type="button" variant="danger" fullWidth onClick={logout}>
          Logout
        </Button>

        <div className="text-center py-4">
          <Logo size="sm" className="mx-auto mb-3" />
          <p className="text-xs text-slate-400">VEEW OS v1.0 · Meter Installation Module</p>
          <p className="text-xs text-slate-400">Vinayaka Electricals & Engineering Works, Chitradurga</p>
        </div>
      </form>
    </div>
  )
}
