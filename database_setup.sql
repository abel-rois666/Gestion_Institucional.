
-- ==========================================================
-- SCRIPT DE CONFIGURACIÓN V10 (FIX UUIDs)
-- EJECUTA ESTO EN EL EDITOR SQL DE SUPABASE
-- ==========================================================

-- 1. Eliminar Tablas (Orden inverso por dependencias)
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.channel_members;
DROP TABLE IF EXISTS public.channels;
DROP TABLE IF EXISTS public.calendar_events;
DROP TABLE IF EXISTS public.event_categories;
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.resources;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.profiles;

-- 2. Eliminar Tipos
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;

-- 3. Crear Tipos
CREATE TYPE user_role AS ENUM ('admin', 'coordinador', 'auxiliar');
CREATE TYPE task_status AS ENUM ('Pendiente', 'En Proceso', 'Completado', 'Atrasado');
CREATE TYPE resource_type AS ENUM ('PDF', 'DRIVE', 'LINK', 'VIDEO', 'IMAGE');

-- 4. Crear Tablas Principales
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY, 
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT NOT NULL,
  role user_role DEFAULT 'auxiliar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY, 
  parent_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  department_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  assignee_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_name TEXT,
  is_specific_task BOOLEAN DEFAULT FALSE,
  status task_status DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.resources (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type resource_type DEFAULT 'LINK',
  category TEXT DEFAULT 'Otros',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Categorías de Eventos
CREATE TABLE public.event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Eventos
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  department TEXT NOT NULL,
  category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
  is_global BOOLEAN DEFAULT FALSE,
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  department_restricted TEXT,
  type TEXT DEFAULT 'public',
  created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.channel_members (
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL, 
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS (Políticas Permisivas para Demo)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.event_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.channel_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Insertar Datos Iniciales
INSERT INTO public.profiles (id, full_name, email, department, role, avatar_url) VALUES
('u-1', 'Dr. Alejandro García', 'director@uni.edu', 'Dirección', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alejandro'),
('u-2', 'Lic. Martha Ruiz', 'coordinador@uni.edu', 'Académico', 'coordinador', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martha'),
('u-3', 'Juan Pérez', 'auxiliar@uni.edu', 'Académico', 'auxiliar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan');

-- Categorías por defecto con UUIDs válidos
INSERT INTO public.event_categories (id, name, color) VALUES
('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Académico', 'blue'),
('d290f1ee-6c54-4b01-90e6-d701748f0852', 'Suspensión / Festivo', 'red'),
('d290f1ee-6c54-4b01-90e6-d701748f0853', 'Reunión', 'purple'),
('d290f1ee-6c54-4b01-90e6-d701748f0854', 'Fecha Límite', 'orange'),
('d290f1ee-6c54-4b01-90e6-d701748f0855', 'Evento Social', 'pink');

-- Canales
INSERT INTO public.channels (id, name, slug, description, type, created_by) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'General', 'general', 'Comunicación general de la universidad', 'public', 'u-1');

INSERT INTO public.channel_members (channel_id, user_id, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u-1', 'owner'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u-2', 'member');

-- Eventos de Ejemplo referenciando los UUIDs válidos de categorías
INSERT INTO public.calendar_events (title, description, start_date, department, category_id, is_global) VALUES
('Junta de Consejo', 'Revisión trimestral', NOW() + INTERVAL '2 days', 'Dirección', 'd290f1ee-6c54-4b01-90e6-d701748f0853', true),
('Suspensión de Labores', 'Día festivo oficial', NOW() + INTERVAL '5 days', 'Dirección', 'd290f1ee-6c54-4b01-90e6-d701748f0852', true);
