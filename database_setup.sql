
-- ==========================================================
-- SCRIPT DE CONFIGURACIÓN DE BASE DE DATOS - CRM UNIVERSITARIO
-- Este script es seguro para ejecutar múltiples veces (Idempotente)
-- ==========================================================

-- 1. TIPOS ENUMERADOS (Con comprobación de existencia)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'coordinador', 'auxiliar');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('Pendiente', 'En Proceso', 'Completado', 'Atrasado');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
        CREATE TYPE resource_type AS ENUM ('PDF', 'DRIVE', 'LINK', 'VIDEO', 'IMAGE');
    END IF;
END $$;

-- 2. TABLAS PRINCIPALES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT NOT NULL,
  role user_role DEFAULT 'auxiliar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  department_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_name TEXT,
  is_specific_task BOOLEAN DEFAULT FALSE,
  status task_status DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type resource_type DEFAULT 'LINK',
  category TEXT DEFAULT 'Otros',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  department_restricted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR SEGURIDAD (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO (Seguro: Se eliminan y recrean)
-- Profiles
DROP POLICY IF EXISTS "Profiles visibles para autenticados" ON public.profiles;
CREATE POLICY "Profiles visibles para autenticados" ON public.profiles 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Edición de propio perfil" ON public.profiles;
CREATE POLICY "Edición de propio perfil" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Tasks
DROP POLICY IF EXISTS "Ver tareas universidad" ON public.tasks;
CREATE POLICY "Ver tareas universidad" ON public.tasks 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Gestionar tareas admins coordinadores" ON public.tasks;
CREATE POLICY "Gestionar tareas admins coordinadores" ON public.tasks 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
  )
);

-- Chat
DROP POLICY IF EXISTS "Ver mensajes chat" ON public.messages;
CREATE POLICY "Ver mensajes chat" ON public.messages 
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Insertar mensajes propios" ON public.messages;
CREATE POLICY "Insertar mensajes propios" ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. FUNCIONES Y TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para public.tasks
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_modtime') THEN
        CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- Trigger para public.profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_modtime') THEN
        CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- 6. DATOS DE CANALES INICIALES (Sólo si no existen)
INSERT INTO public.channels (name, slug, description)
SELECT 'General', 'general', 'Comunicación para toda la universidad'
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE slug = 'general');

INSERT INTO public.channels (name, slug, description)
SELECT 'Urgencias', 'urgencias', 'Canal para reportar bloqueos operativos'
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE slug = 'urgencias');

INSERT INTO public.channels (name, slug, description)
SELECT 'Académico', 'academico', 'Coordinación docente y planes de estudio'
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE slug = 'academico');
