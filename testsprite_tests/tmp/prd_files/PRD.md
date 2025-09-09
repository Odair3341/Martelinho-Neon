# PRD - Sistema de Gestão Financeira Martelinho

## 1. Visão Geral do Produto

### 1.1 Descrição
Sistema de gestão financeira desenvolvido especificamente para oficinas automotivas, focado no controle de serviços, clientes, despesas e comissões. O sistema oferece uma interface moderna e intuitiva para gerenciamento completo das operações financeiras.

### 1.2 Objetivos
- Centralizar o controle financeiro da oficina
- Automatizar o cálculo de comissões
- Facilitar o acompanhamento de receitas e despesas
- Gerar relatórios financeiros detalhados
- Proporcionar backup seguro dos dados

### 1.3 Público-Alvo
- Proprietários de oficinas automotivas
- Gerentes financeiros
- Funcionários responsáveis pelo controle administrativo

## 2. Funcionalidades Principais

### 2.1 Gestão de Clientes
- **Cadastro de clientes**: Registro de informações básicas dos clientes
- **Visualização de clientes**: Lista completa com informações organizadas
- **Histórico de serviços**: Acompanhamento dos serviços realizados por cliente

### 2.2 Controle de Serviços
- **Registro de serviços**: Cadastro detalhado de serviços automotivos
- **Informações do veículo**: Controle de placa, modelo e dados do veículo
- **Valores e comissões**: Cálculo automático de comissões baseado em percentuais
- **Status de pagamento**: Controle de quitação dos serviços
- **Observações**: Campo para anotações específicas do serviço

### 2.3 Gestão de Despesas
- **Cadastro de despesas**: Registro de gastos operacionais
- **Controle de vencimentos**: Acompanhamento de datas de vencimento
- **Status de pagamento**: Controle de despesas pagas e pendentes
- **Categorização**: Organização por tipo de despesa

### 2.4 Controle de Comissões
- **Cálculo automático**: Baseado nos percentuais definidos nos serviços
- **Status de recebimento**: Controle de comissões pendentes, recebidas e atrasadas
- **Histórico**: Acompanhamento temporal das comissões
- **Relatórios**: Visualização detalhada por período

### 2.5 Relatórios Financeiros
- **Dashboard executivo**: Visão geral das métricas principais
- **Relatórios por período**: Filtros por data para análises específicas
- **Exportação PDF**: Geração de relatórios em formato PDF
- **Gráficos e métricas**: Visualização de dados através de charts

### 2.6 Backup e Importação
- **Backup automático**: Exportação dos dados em formato JSON
- **Importação de dados**: Restauração de backups anteriores
- **Versionamento**: Controle de versões dos backups
- **Segurança**: Validação de integridade dos dados

### 2.7 Autenticação e Segurança
- **Login seguro**: Autenticação via Supabase
- **Sessões persistentes**: Manutenção de login entre sessões
- **Controle de acesso**: Proteção das rotas e dados

## 3. Especificações Técnicas

### 3.1 Arquitetura
- **Frontend**: React 18 com TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Componentes**: Shadcn/ui baseado em Radix UI
- **Backend**: Supabase (BaaS)
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form com Zod

### 3.2 Dependências Principais
- **UI/UX**: @radix-ui/*, lucide-react, tailwindcss
- **Dados**: @supabase/supabase-js, @tanstack/react-query
- **Formulários**: react-hook-form, zod
- **Relatórios**: recharts, jspdf, html2canvas
- **Utilitários**: date-fns, clsx, class-variance-authority

### 3.3 Estrutura de Dados

#### Cliente
```typescript
interface Cliente {
  id: number;
  nome: string;
}
```

#### Serviço
```typescript
interface Servico {
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
```

#### Despesa
```typescript
interface Despesa {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  pago: boolean;
}
```

#### Comissão
```typescript
interface Comissao {
  id: number;
  servico_id: number;
  valor: number;
  data_recebimento: string;
  status: 'pendente' | 'recebido' | 'atrasado';
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}
```

## 4. Interface do Usuário

### 4.1 Layout Principal
- **Header**: Logo, navegação e controles de usuário
- **Sidebar**: Menu de navegação entre módulos
- **Área principal**: Conteúdo específico de cada módulo
- **Footer**: Informações adicionais e status

### 4.2 Módulos de Interface
1. **Dashboard**: Visão geral com métricas e gráficos
2. **Clientes**: Listagem e gestão de clientes
3. **Serviços**: Controle de serviços realizados
4. **Despesas**: Gestão de gastos operacionais
5. **Comissões**: Controle de comissões
6. **Relatórios**: Geração e visualização de relatórios
7. **Backup**: Exportação e importação de dados

### 4.3 Responsividade
- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com navegação colapsável
- **Mobile**: Interface otimizada para telas pequenas

## 5. Fluxos de Trabalho

### 5.1 Fluxo de Cadastro de Serviço
1. Seleção/cadastro do cliente
2. Preenchimento dos dados do veículo
3. Definição do valor e percentual de comissão
4. Adição de observações (opcional)
5. Salvamento do serviço
6. Cálculo automático da comissão

### 5.2 Fluxo de Controle Financeiro
1. Visualização do dashboard
2. Análise das métricas principais
3. Acesso aos relatórios detalhados
4. Filtros por período
5. Exportação de relatórios

### 5.3 Fluxo de Backup
1. Acesso ao módulo de backup
2. Seleção dos dados para exportação
3. Geração do arquivo JSON
4. Download do backup
5. Armazenamento seguro

## 6. Requisitos Não Funcionais

### 6.1 Performance
- Tempo de carregamento inicial < 3 segundos
- Navegação entre páginas < 1 segundo
- Geração de relatórios < 5 segundos

### 6.2 Segurança
- Autenticação obrigatória
- Criptografia de dados sensíveis
- Validação de entrada de dados
- Proteção contra XSS e CSRF

### 6.3 Usabilidade
- Interface intuitiva e amigável
- Feedback visual para ações do usuário
- Mensagens de erro claras
- Suporte a teclado e acessibilidade

### 6.4 Compatibilidade
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móveis (iOS, Android)
- Resolução mínima: 320px

## 7. Roadmap e Melhorias Futuras

### 7.1 Versão Atual (v1.0)
- ✅ Gestão básica de clientes, serviços e despesas
- ✅ Controle de comissões
- ✅ Relatórios financeiros
- ✅ Sistema de backup

### 7.2 Próximas Versões
- **v1.1**: Notificações automáticas de vencimentos
- **v1.2**: Integração com sistemas de pagamento
- **v1.3**: App mobile nativo
- **v1.4**: Relatórios avançados com BI
- **v1.5**: Integração com sistemas contábeis

## 8. Critérios de Aceitação

### 8.1 Funcionalidades Core
- [ ] Usuário consegue fazer login/logout
- [ ] Usuário consegue cadastrar clientes
- [ ] Usuário consegue registrar serviços
- [ ] Usuário consegue controlar despesas
- [ ] Usuário consegue visualizar comissões
- [ ] Usuário consegue gerar relatórios
- [ ] Usuário consegue fazer backup dos dados

### 8.2 Performance
- [ ] Sistema carrega em menos de 3 segundos
- [ ] Navegação é fluida e responsiva
- [ ] Relatórios são gerados rapidamente

### 8.3 Usabilidade
- [ ] Interface é intuitiva para usuários não técnicos
- [ ] Sistema funciona em dispositivos móveis
- [ ] Mensagens de erro são claras e úteis

## 9. Métricas de Sucesso

### 9.1 Adoção
- Taxa de retenção de usuários > 90%
- Tempo médio de sessão > 15 minutos
- Frequência de uso > 3x por semana

### 9.2 Performance
- Tempo de carregamento < 3 segundos
- Taxa de erro < 1%
- Disponibilidade > 99.5%

### 9.3 Satisfação
- NPS (Net Promoter Score) > 8
- Taxa de suporte < 5%
- Feedback positivo > 85%

---

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Autor**: Sistema TestSprite  
**Status**: Ativo