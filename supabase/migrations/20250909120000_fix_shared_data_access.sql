-- Migration to enable shared data access across all authenticated users
-- This replaces the user-specific RLS policies with shared access policies

-- Drop existing RLS policies for clientes
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clientes;

-- Drop existing RLS policies for servicos
DROP POLICY IF EXISTS "Users can view their own services" ON public.servicos;
DROP POLICY IF EXISTS "Users can insert their own services" ON public.servicos;
DROP POLICY IF EXISTS "Users can update their own services" ON public.servicos;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.servicos;

-- Drop existing RLS policies for despesas
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.despesas;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.despesas;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.despesas;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.despesas;

-- Drop existing RLS policies for comissoes
DROP POLICY IF EXISTS "Users can view their own commissions" ON public.comissoes;
DROP POLICY IF EXISTS "Users can insert their own commissions" ON public.comissoes;
DROP POLICY IF EXISTS "Users can update their own commissions" ON public.comissoes;
DROP POLICY IF EXISTS "Users can delete their own commissions" ON public.comissoes;

-- Create new shared access policies for clientes
CREATE POLICY "Authenticated users can view all clients" ON public.clientes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON public.clientes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all clients" ON public.clientes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all clients" ON public.clientes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create new shared access policies for servicos
CREATE POLICY "Authenticated users can view all services" ON public.servicos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert services" ON public.servicos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all services" ON public.servicos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all services" ON public.servicos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create new shared access policies for despesas
CREATE POLICY "Authenticated users can view all expenses" ON public.despesas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert expenses" ON public.despesas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all expenses" ON public.despesas
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all expenses" ON public.despesas
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create new shared access policies for comissoes
CREATE POLICY "Authenticated users can view all commissions" ON public.comissoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert commissions" ON public.comissoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update all commissions" ON public.comissoes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete all commissions" ON public.comissoes
  FOR DELETE USING (auth.role() = 'authenticated');
