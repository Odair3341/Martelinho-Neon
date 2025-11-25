-- Neon-compatible schema initialization for Martelinho Neon
-- This file avoids Supabase-specific features (auth schema, RLS policies)

-- Create the clients table
CREATE TABLE IF NOT EXISTS public.clientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID
);

-- Create the services table
CREATE TABLE IF NOT EXISTS public.servicos (
  id BIGSERIAL PRIMARY KEY,
  data_servico DATE NOT NULL,
  veiculo TEXT NOT NULL,
  placa TEXT NOT NULL,
  valor_bruto DECIMAL(10,2) NOT NULL,
  porcentagem_comissao DECIMAL(5,2) NOT NULL,
  observacao TEXT DEFAULT '',
  valor_pago DECIMAL(10,2) DEFAULT 0,
  quitado BOOLEAN DEFAULT false,
  comissao_recebida DECIMAL(10,2) DEFAULT 0,
  cliente_id BIGINT REFERENCES public.clientes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID
);

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.despesas (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  pago BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID
);

-- Create the commissions table
CREATE TABLE IF NOT EXISTS public.comissoes (
  id BIGSERIAL PRIMARY KEY,
  servico_id BIGINT REFERENCES public.servicos(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  data_recebimento DATE NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'recebido', 'atrasado')) DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_clientes_updated_at'
  ) THEN
    CREATE TRIGGER update_clientes_updated_at
      BEFORE UPDATE ON public.clientes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_servicos_updated_at'
  ) THEN
    CREATE TRIGGER update_servicos_updated_at
      BEFORE UPDATE ON public.servicos
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_despesas_updated_at'
  ) THEN
    CREATE TRIGGER update_despesas_updated_at
      BEFORE UPDATE ON public.despesas
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comissoes_updated_at'
  ) THEN
    CREATE TRIGGER update_comissoes_updated_at
      BEFORE UPDATE ON public.comissoes
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_servicos_cliente_id ON public.servicos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_servicos_data_servico ON public.servicos(data_servico);
CREATE INDEX IF NOT EXISTS idx_servicos_user_id ON public.servicos(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_data_vencimento ON public.despesas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_comissoes_servico_id ON public.comissoes(servico_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_user_id ON public.comissoes(user_id);