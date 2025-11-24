export interface Cliente {
  id: number | string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cpf?: string;
  data_cadastro?: string;
}

export interface Servico {
  id: number | string;
  data_servico: string;
  veiculo: string;
  placa: string;
  valor_bruto: number;
  porcentagem_comissao: number;
  observacao: string;
  valor_pago: number;
  quitado: boolean;
  comissao_recebida: number;
  cliente_id: number | string;
  data_recebimento_comissao?: string; // Data quando a comissão foi recebida
}

export interface Despesa {
  id: number | string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  pago: boolean;
}

export interface Comissao {
  id: number;
  servico_id: number;
  valor: number;
  data_recebimento: string;
  status: 'pendente' | 'recebido' | 'atrasado';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface BusinessData {
  clientes: Cliente[];
  servicos: Servico[];
  despesas: Despesa[];
  comissoes: Comissao[];
  metadata: {
    exportDate: string;
    version: string;
    totalClientes: number;
    totalServicos: number;
    totalDespesas: number;
    totalComissoes: number;
  };
}
