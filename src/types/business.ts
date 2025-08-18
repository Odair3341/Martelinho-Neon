export interface Cliente {
  id: number;
  nome: string;
}

export interface Servico {
  id: number;
  data_servico: string;
  veiculo: string;
  placa: string;
  valor_bruto: number;
  porcentagem_comissao: number;
  observacao: string;
  valor_pago: number;
  quitado: boolean;
  comissao_recebida: number;
  cliente_id: number;
}

export interface Despesa {
  id: number;
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