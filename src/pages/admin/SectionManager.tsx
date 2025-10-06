import React, { useState, useEffect } from 'react'
import { supabase, StudySection } from '../../lib/supabase'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { COLOR_OPTIONS, EXAM_COLORS } from '../../constants/colors'

const SectionManager: React.FC = () => {
  const [sections, setSections] = useState<StudySection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<StudySection | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Load sections from Supabase
  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('study_sections')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setSections(data || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (sectionData: Partial<StudySection>) => {
    try {
      if (editingSection) {
        // Update existing section
        const { error } = await supabase
          .from('study_sections')
          .update({
            title: sectionData.title,
            description: sectionData.description,
            weight: sectionData.weight,
            color: sectionData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSection.id)

        if (error) throw error
      } else {
        // Create new section
        const { error } = await supabase
          .from('study_sections')
          .insert([{
            title: sectionData.title,
            description: sectionData.description,
            weight: sectionData.weight,
            color: sectionData.color
          }])

        if (error) throw error
      }

      await fetchSections()
      setEditingSection(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error al guardar la sección')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sección?')) return

    try {
      const { error } = await supabase
        .from('study_sections')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchSections()
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Error al eliminar la sección')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">Secciones de Estudio</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-brand-main text-white px-4 py-2 rounded-lg hover:bg-opacity-90 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Sección
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingSection) && (
        <SectionForm
          section={editingSection}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false)
            setEditingSection(null)
          }}
        />
      )}

      {/* Sections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className={`w-full h-4 ${section.color} rounded-t-lg mb-4`}></div>
            
            <h3 className="text-xl font-bold text-brand-dark mb-2">{section.title}</h3>
            <p className="text-gray-600 mb-4">{section.description}</p>
            
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>Peso: {section.weight}%</span>
              <span>{new Date(section.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingSection(section)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(section.id)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No hay secciones creadas aún</p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-brand-main text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
          >
            Crear Primera Sección
          </button>
        </div>
      )}
    </div>
  )
}

// Section Form Component
interface SectionFormProps {
  section: StudySection | null
  onSave: (data: Partial<StudySection>) => void
  onCancel: () => void
}

const SectionForm: React.FC<SectionFormProps> = ({ section, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: section?.title || '',
    description: section?.description || '',
    weight: section?.weight || 0,
    color: section?.color || EXAM_COLORS.default.tailwind
  })

  const colorOptions = COLOR_OPTIONS

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-brand-dark mb-6">
        {section ? 'Editar Sección' : 'Nueva Sección'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Peso del Examen (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-full h-10 ${color} rounded-lg border-2 ${
                  formData.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-brand-main text-white px-4 py-2 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default SectionManager