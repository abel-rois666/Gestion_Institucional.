
-- ==========================================================
-- SCRIPT DE CORRECCIÓN: TABLAS DE INVENTARIO V2
-- EJECUTA ESTO EN EL EDITOR SQL DE SUPABASE
-- ==========================================================

-- 1. Limpieza preventiva
DROP TABLE IF EXISTS public.inventory_stock CASCADE;
DROP TABLE IF EXISTS public.requisitions CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.inventory_categories CASCADE;

-- 2. Crear Tabla de Categorías
CREATE TABLE public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL, 
  current_sequence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear Tabla de Items (Catálogo)
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear Tabla de Stock
CREATE TABLE public.inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  department TEXT NOT NULL, 
  quantity INTEGER DEFAULT 0,
  UNIQUE(item_id, department)
);

-- 5. Crear Tabla de Requisiciones (ACTUALIZADA)
CREATE TABLE public.requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT NOT NULL, -- Quien pide
  target_department TEXT DEFAULT 'Recursos Humanos y Materiales', -- A quien se le pide (RRHH o Direccion)
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  justification TEXT NOT NULL,
  observations TEXT,
  status TEXT DEFAULT 'Pendiente', 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Habilitar Seguridad (RLS)
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso total
CREATE POLICY "Acceso total categorias" ON public.inventory_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total stock" ON public.inventory_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total requisiciones" ON public.requisitions FOR ALL USING (true) WITH CHECK (true);

-- 7. Insertar Datos de Ejemplo (Seed)

-- Categorías
INSERT INTO public.inventory_categories (name, prefix, current_sequence) VALUES
('Papelería', 'PAP', 2),
('Limpieza', 'LIM', 1),
('Tecnología', 'TEC', 5),
('Mobiliario', 'MOB', 0);

-- Items
INSERT INTO public.inventory_items (id, code, name, category, description) VALUES
('b2345678-1234-5678-1234-567812345601', 'PAP-001', 'Papel Bond Carta', 'Papelería', 'Paquete de 500 hojas'),
('b2345678-1234-5678-1234-567812345602', 'PAP-002', 'Marcadores Pizarrón', 'Papelería', 'Caja de 4 colores'),
('b2345678-1234-5678-1234-567812345603', 'LIM-001', 'Cloro', 'Limpieza', 'Galón 5 litros'),
('b2345678-1234-5678-1234-567812345604', 'TEC-001', 'Cable HDMI', 'Tecnología', 'Cable 3 metros alta velocidad');

-- Stock (Bodega General)
INSERT INTO public.inventory_stock (item_id, department, quantity) VALUES
('b2345678-1234-5678-1234-567812345601', 'Bodega General', 50),
('b2345678-1234-5678-1234-567812345602', 'Bodega General', 20),
('b2345678-1234-5678-1234-567812345603', 'Bodega General', 10),
('b2345678-1234-5678-1234-567812345604', 'Bodega General', 5);
