import React from 'react'
import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import SectionManager from './SectionManager'
import { 
  LayoutDashboard, 
  BookOpen, 
  LogOut, 
  User,
  Settings,
  BarChart3
} from 'lucide-react'

const AdminDashboard: React.FC = () => {
  const { user, signOut, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Secciones de Estudio', href: '/admin/sections', icon: BookOpen },
    { name: 'Estadísticas', href: '/admin/stats', icon: BarChart3 },
    { name: 'Configuración', href: '/admin/settings', icon: Settings },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-brand-main rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-brand-dark">Repaso Admin</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-brand-main text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center px-4 py-2 text-sm text-gray-700">
              <User className="w-5 h-5 mr-3" />
              <span className="truncate">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 mt-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8">
          <Routes>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/sections" element={<SectionManager />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// Dashboard Home Component
const DashboardHome: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-brand-dark mb-8">Panel de Administración</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Secciones de Estudio</h3>
        <p className="text-3xl font-bold text-brand-main">8</p>
        <p className="text-sm text-gray-500">Secciones activas</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Temas Totales</h3>
        <p className="text-3xl font-bold text-brand-accent-1">45</p>
        <p className="text-sm text-gray-500">Temas disponibles</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Uso de IA</h3>
        <p className="text-3xl font-bold text-green-600">124</p>
        <p className="text-sm text-gray-500">Consultas este mes</p>
      </div>
    </div>
  </div>
)

// Placeholder components
const StatsPage: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-brand-dark mb-8">Estadísticas</h1>
    <p className="text-gray-600">Próximamente: Métricas de uso y rendimiento</p>
  </div>
)

const SettingsPage: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-brand-dark mb-8">Configuración</h1>
    <p className="text-gray-600">Próximamente: Configuración de la aplicación</p>
  </div>
)

export default AdminDashboard