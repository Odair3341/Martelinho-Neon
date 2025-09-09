-- Seed data migration
-- This migration adds sample data to populate the database

-- Insert sample clients
INSERT INTO public.clientes (nome, user_id) VALUES
('João Silva', null),
('Maria Santos', null),
('Pedro Oliveira', null),
('Ana Costa', null),
('Carlos Ferreira', null)
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO public.servicos (data_servico, veiculo, placa, valor_bruto, porcentagem_comissao, observacao, valor_pago, quitado, comissao_recebida, cliente_id, user_id) VALUES
('2024-01-15', 'Honda Civic', 'ABC-1234', 1500.00, 10.00, 'Reparo completo da lataria', 1500.00, true, 150.00, 1, null),
('2024-01-20', 'Toyota Corolla', 'DEF-5678', 800.00, 12.00, 'Pintura do para-choque', 800.00, true, 96.00, 2, null),
('2024-01-25', 'Volkswagen Gol', 'GHI-9012', 2200.00, 15.00, 'Funilaria e pintura lateral', 1100.00, false, 0.00, 3, null),
('2024-02-01', 'Ford Ka', 'JKL-3456', 650.00, 8.00, 'Reparo de riscos', 650.00, true, 52.00, 4, null),
('2024-02-05', 'Chevrolet Onix', 'MNO-7890', 1800.00, 12.00, 'Troca de peças e pintura', 900.00, false, 0.00, 5, null)
ON CONFLICT DO NOTHING;

-- Insert sample expenses
INSERT INTO public.despesas (descricao, valor, data_vencimento, pago, user_id) VALUES
('Aluguel da oficina', 2500.00, '2024-02-10', true, null),
('Energia elétrica', 450.00, '2024-02-15', true, null),
('Compra de tintas', 800.00, '2024-02-20', false, null),
('Ferramentas novas', 1200.00, '2024-02-25', false, null),
('Seguro da oficina', 350.00, '2024-03-01', false, null)
ON CONFLICT DO NOTHING;

-- Insert sample commissions
INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status, user_id) VALUES
(1, 150.00, '2024-01-16', 'recebido', null),
(2, 96.00, '2024-01-21', 'recebido', null),
(3, 330.00, '2024-02-10', 'pendente', null),
(4, 52.00, '2024-02-02', 'recebido', null),
(5, 216.00, '2024-02-20', 'pendente', null)
ON CONFLICT DO NOTHING;