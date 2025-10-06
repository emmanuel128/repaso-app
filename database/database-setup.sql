-- Repaso App Database Schema
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS study_topics CASCADE;
DROP TABLE IF EXISTS study_sections CASCADE;

-- Create study_sections table
CREATE TABLE study_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'bg-[#808670]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_topics table
CREATE TABLE study_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES study_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_study_topics_section_id ON study_topics(section_id);
CREATE INDEX idx_study_topics_order ON study_topics(section_id, order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE study_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for study_sections
-- Allow everyone to read sections (for the main app)
CREATE POLICY "Allow public read access on study_sections" 
  ON study_sections FOR SELECT 
  USING (true);

-- Only authenticated users can modify sections
CREATE POLICY "Allow authenticated users to insert study_sections" 
  ON study_sections FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update study_sections" 
  ON study_sections FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete study_sections" 
  ON study_sections FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for study_topics
-- Allow everyone to read topics (for the main app)
CREATE POLICY "Allow public read access on study_topics" 
  ON study_topics FOR SELECT 
  USING (true);

-- Only authenticated users can modify topics
CREATE POLICY "Allow authenticated users to insert study_topics" 
  ON study_topics FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update study_topics" 
  ON study_topics FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete study_topics" 
  ON study_topics FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_study_sections_updated_at 
  BEFORE UPDATE ON study_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_topics_updated_at 
  BEFORE UPDATE ON study_topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - you can skip this if you want to start fresh)
INSERT INTO study_sections (title, description, weight, color) VALUES
  ('Ética/Legal', 'Principios éticos y aspectos legales en la práctica psicológica', 15, 'bg-[#808670]'),
  ('Evaluación', 'Métodos y técnicas de evaluación psicológica', 14, 'bg-[#A0AB89]'),
  ('Tratamiento', 'Intervenciones y tratamientos psicológicos', 14, 'bg-[#BF8A64]'),
  ('Cognitivo-Afectivo', 'Procesos cognitivos y emocionales', 13, 'bg-[#BD612A]'),
  ('Biológicas', 'Bases biológicas del comportamiento', 12, 'bg-[#E89B40]'),
  ('Social/Multicultural', 'Psicología social y consideraciones multiculturales', 12, 'bg-[#E6B883]'),
  ('Desarrollo', 'Psicología del desarrollo humano', 12, 'bg-[#F0E1D1]'),
  ('Investigación', 'Metodología de investigación y estadísticas', 8, 'bg-[#d1d5db]');

-- Insert sample topics for the first section
INSERT INTO study_topics (section_id, title, order_index) 
SELECT id, 'Códigos de Ética Profesional', 1 FROM study_sections WHERE title = 'Ética/Legal'
UNION ALL
SELECT id, 'Legislación en Salud Mental', 2 FROM study_sections WHERE title = 'Ética/Legal'
UNION ALL
SELECT id, 'Confidencialidad y Privacidad', 3 FROM study_sections WHERE title = 'Ética/Legal'
UNION ALL
SELECT id, 'Consentimiento Informado', 4 FROM study_sections WHERE title = 'Ética/Legal'
UNION ALL
SELECT id, 'Competencia Profesional', 5 FROM study_sections WHERE title = 'Ética/Legal';

-- Verify the data
SELECT 'study_sections' as table_name, count(*) as count FROM study_sections
UNION ALL
SELECT 'study_topics' as table_name, count(*) as count FROM study_topics;