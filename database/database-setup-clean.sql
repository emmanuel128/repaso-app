-- Repaso App Database Schema (Clean Version - No Sample Data)
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
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

-- Create indexes
CREATE INDEX idx_study_topics_section_id ON study_topics(section_id);
CREATE INDEX idx_study_topics_order ON study_topics(section_id, order_index);

-- Enable Row Level Security
ALTER TABLE study_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_topics ENABLE ROW LEVEL SECURITY;

-- Public read access (for main app)
CREATE POLICY "Public read access" ON study_sections FOR SELECT USING (true);
CREATE POLICY "Public read access" ON study_topics FOR SELECT USING (true);

-- Admin access (for authenticated users)
CREATE POLICY "Admin full access" ON study_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON study_topics FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_study_sections_updated_at 
  BEFORE UPDATE ON study_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_topics_updated_at 
  BEFORE UPDATE ON study_topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();