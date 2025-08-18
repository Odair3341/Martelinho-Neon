-- Create the clients table
CREATE TABLE public.clientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create the services table
CREATE TABLE public.servicos (
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create the expenses table
CREATE TABLE public.despesas (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  pago BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create the commissions table
CREATE TABLE public.comissoes (
  id BIGSERIAL PRIMARY KEY,
  servico_id BIGINT REFERENCES public.servicos(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  data_recebimento DATE NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'recebido', 'atrasado')) DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clientes
CREATE POLICY "Users can view their own clients" ON public.clientes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON public.clientes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON public.clientes
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for servicos
CREATE POLICY "Users can view their own services" ON public.servicos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services" ON public.servicos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON public.servicos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON public.servicos
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for despesas
CREATE POLICY "Users can view their own expenses" ON public.despesas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON public.despesas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.despesas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.despesas
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for comissoes
CREATE POLICY "Users can view their own commissions" ON public.comissoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commissions" ON public.comissoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commissions" ON public.comissoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commissions" ON public.comissoes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despesas_updated_at
  BEFORE UPDATE ON public.despesas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comissoes_updated_at
  BEFORE UPDATE ON public.comissoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_servicos_cliente_id ON public.servicos(cliente_id);
CREATE INDEX idx_servicos_data_servico ON public.servicos(data_servico);
CREATE INDEX idx_servicos_user_id ON public.servicos(user_id);
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX idx_despesas_data_vencimento ON public.despesas(data_vencimento);
CREATE INDEX idx_comissoes_servico_id ON public.comissoes(servico_id);
CREATE INDEX idx_comissoes_user_id ON public.comissoes(user_id);