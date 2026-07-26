-- ==============================================================================
-- SCRIPT DE CARGA INICIAL (SEED) PARA PIPELINES, ETAPAS E PASSOS
-- Projeto: Contabilize Seguro - Central do Cliente
-- Data: 26/07/2026
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. INSERÇÃO DOS PIPELINES PRINCIPAIS
-- ------------------------------------------------------------------------------
INSERT INTO "Pipelines" ("Id", "Codigo", "Nome", "Descricao", "Ordem", "Ativo", "CriadaEm", "AtualizadaEm")
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'abertura', 'Abertura de empresa', 'Processo completo de abertura de novas empresas', 1, true, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'transferencia', 'Cliente com empresa (transferência)', 'Processo de transferência de contabilidade e onboarding de clientes existentes', 2, true, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- 2. INSERÇÃO DAS ETAPAS DO PIPELINE: Abertura de Empresa ('abertura')
-- ------------------------------------------------------------------------------
INSERT INTO "PipelineEtapas" ("Id", "PipelineId", "Label", "Hint", "Ordem", "CriadaEm", "AtualizadaEm")
VALUES
  ('b0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000001', 'Jornada de abertura', NULL, 1, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'Viabilidade', NULL, 2, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000001', 'Coletor Nacional (DBE)', NULL, 3, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000001', 'Contrato social', NULL, 4, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000105', 'a0000000-0000-0000-0000-000000000001', 'Certificado digital', NULL, 5, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000106', 'a0000000-0000-0000-0000-000000000001', 'Opção pelo Simples', NULL, 6, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000107', 'a0000000-0000-0000-0000-000000000001', 'Inscrição municipal', NULL, 7, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000108', 'a0000000-0000-0000-0000-000000000001', 'Licenciamento', NULL, 8, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000109', 'a0000000-0000-0000-0000-000000000001', 'Cadastro SUSEP', NULL, 9, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000110', 'a0000000-0000-0000-0000-000000000001', 'Finalização', NULL, 10, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- 3. INSERÇÃO DOS PASSOS DO PIPELINE: Abertura de Empresa ('abertura')
-- ------------------------------------------------------------------------------

-- Etapa 1: Jornada de abertura
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000101', 'Envio da jornada', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000102', 'b0000000-0000-0000-0000-000000000101', 'Documentos recebidos', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000103', 'b0000000-0000-0000-0000-000000000101', 'Validação dos documentos', NULL, 3, NOW(), NOW());

-- Etapa 2: Viabilidade
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000104', 'b0000000-0000-0000-0000-000000000102', 'Nova viabilidade', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000105', 'b0000000-0000-0000-0000-000000000102', 'Preencher informações do estabelecimento e empresarial', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000106', 'b0000000-0000-0000-0000-000000000102', 'Transmitir viabilidade', NULL, 3, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000107', 'b0000000-0000-0000-0000-000000000102', 'Salvar protocolo Redesim', NULL, 4, NOW(), NOW());

-- Etapa 3: Coletor Nacional (DBE)
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000108', 'b0000000-0000-0000-0000-000000000103', 'Informar protocolo', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000109', 'b0000000-0000-0000-0000-000000000103', 'Dados dos sócios', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000110', 'b0000000-0000-0000-0000-000000000103', 'Informações complementares', NULL, 3, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000111', 'b0000000-0000-0000-0000-000000000103', 'Transmitir DBE', NULL, 4, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000112', 'b0000000-0000-0000-0000-000000000103', 'Confirmação Receita Federal', NULL, 5, NOW(), NOW());

-- Etapa 4: Contrato social
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000113', 'b0000000-0000-0000-0000-000000000104', 'Informar protocolo', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000114', 'b0000000-0000-0000-0000-000000000104', 'Confirmar dados dos sócios e da empresa', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000115', 'b0000000-0000-0000-0000-000000000104', 'Formular contrato social', NULL, 3, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000116', 'b0000000-0000-0000-0000-000000000104', 'Recolher e pagar a DARE', NULL, 4, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000117', 'b0000000-0000-0000-0000-000000000104', 'Coletar assinatura de documentos e contratos', NULL, 5, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000118', 'b0000000-0000-0000-0000-000000000104', 'Inserir documentos no sistema', NULL, 6, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000119', 'b0000000-0000-0000-0000-000000000104', 'Aguardar aprovação e salvar documentos', NULL, 7, NOW(), NOW());

-- Etapa 5: Certificado digital
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000120', 'b0000000-0000-0000-0000-000000000105', 'Enviar informações do cliente para Juliana', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000121', 'b0000000-0000-0000-0000-000000000105', 'Informar cliente sobre horários disponíveis', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000122', 'b0000000-0000-0000-0000-000000000105', 'Acompanhar agendamento', NULL, 3, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000123', 'b0000000-0000-0000-0000-000000000105', 'Instalar certificado', NULL, 4, NOW(), NOW());

-- Etapa 6: Opção pelo Simples
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000124', 'b0000000-0000-0000-0000-000000000106', 'Confirmar registro da empresa no Simples Nacional', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000125', 'b0000000-0000-0000-0000-000000000106', 'Coletar assinaturas', NULL, 2, NOW(), NOW());

-- Etapa 7: Inscrição municipal
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000126', 'b0000000-0000-0000-0000-000000000107', 'Desbloquear CCM', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000127', 'b0000000-0000-0000-0000-000000000107', 'Confirmar dados', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000128', 'b0000000-0000-0000-0000-000000000107', 'Salvar CCM', NULL, 3, NOW(), NOW());

-- Etapa 8: Licenciamento
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000129', 'b0000000-0000-0000-0000-000000000108', 'Preencher dados', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000130', 'b0000000-0000-0000-0000-000000000108', 'Responder perguntas sobre licenciamento', NULL, 2, NOW(), NOW());

-- Etapa 9: Cadastro SUSEP
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000131', 'b0000000-0000-0000-0000-000000000109', 'Acessar SUSEP do corretor', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000132', 'b0000000-0000-0000-0000-000000000109', 'Preencher dados da empresa', NULL, 2, NOW(), NOW());

-- Etapa 10: Finalização
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000133', 'b0000000-0000-0000-0000-000000000110', 'Enviar documentos e informações ao cliente', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000134', 'b0000000-0000-0000-0000-000000000110', 'Onboarding de processos', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000135', 'b0000000-0000-0000-0000-000000000110', 'Assinatura do contrato', NULL, 3, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- 4. INSERÇÃO DAS ETAPAS DO PIPELINE: Transferência ('transferencia')
-- ------------------------------------------------------------------------------
INSERT INTO "PipelineEtapas" ("Id", "PipelineId", "Label", "Hint", "Ordem", "CriadaEm", "AtualizadaEm")
VALUES
  ('b0000000-0000-0000-0000-000000000201', 'a0000000-0000-0000-0000-000000000002', 'Transferência de contabilidade', NULL, 1, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000202', 'a0000000-0000-0000-0000-000000000002', 'Onboarding', NULL, 2, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000203', 'a0000000-0000-0000-0000-000000000002', 'Notas fiscais', 'Dia 1 ao dia 5', 3, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000204', 'a0000000-0000-0000-0000-000000000002', 'DAS', 'Dia 10 ao dia 15', 4, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000205', 'a0000000-0000-0000-0000-000000000002', 'Faturamento anual', NULL, 5, NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000206', 'a0000000-0000-0000-0000-000000000002', 'Controle de pendências', NULL, 6, NOW(), NOW());

-- ------------------------------------------------------------------------------
-- 5. INSERÇÃO DOS PASSOS DO PIPELINE: Transferência ('transferencia')
-- ------------------------------------------------------------------------------

-- Etapa 1: Transferência de contabilidade
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000201', 'b0000000-0000-0000-0000-000000000201', 'Assinatura do contrato', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000202', 'b0000000-0000-0000-0000-000000000201', 'Pedido de transferência para a antiga contabilidade', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000203', 'b0000000-0000-0000-0000-000000000201', 'Conferir documentação', NULL, 3, NOW(), NOW());

-- Etapa 2: Onboarding
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000204', 'b0000000-0000-0000-0000-000000000202', 'Iniciar serviços contábeis', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000205', 'b0000000-0000-0000-0000-000000000202', 'Configurar acessos do cliente', NULL, 2, NOW(), NOW());

-- Etapa 3: Notas fiscais
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000206', 'b0000000-0000-0000-0000-000000000203', 'Apurar comissões', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000207', 'b0000000-0000-0000-0000-000000000203', 'Apurar outras receitas', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000208', 'b0000000-0000-0000-0000-000000000203', 'Emitir NFs', NULL, 3, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000209', 'b0000000-0000-0000-0000-000000000203', 'Importar NFs ao sistema', NULL, 4, NOW(), NOW());

-- Etapa 4: DAS
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000210', 'b0000000-0000-0000-0000-000000000204', 'Transmitir pelo sistema', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000211', 'b0000000-0000-0000-0000-000000000204', 'Salvar nos arquivos', NULL, 2, NOW(), NOW());

-- Etapa 5: Faturamento anual
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000212', 'b0000000-0000-0000-0000-000000000205', 'Apurar faturamento anual', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000213', 'b0000000-0000-0000-0000-000000000205', 'Salvar nos arquivos', NULL, 2, NOW(), NOW());

-- Etapa 6: Controle de pendências
INSERT INTO "PipelinePassos" ("Id", "PipelineEtapaId", "Titulo", "Descricao", "Ordem", "CriadaEm", "AtualizadaEm") VALUES
  ('c0000000-0000-0000-0000-000000000214', 'b0000000-0000-0000-0000-000000000206', 'Verificar E-CAC', NULL, 1, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000215', 'b0000000-0000-0000-0000-000000000206', 'Verificar DUC', NULL, 2, NOW(), NOW()),
  ('c0000000-0000-0000-0000-000000000216', 'b0000000-0000-0000-0000-000000000206', 'Verificar DEC', NULL, 3, NOW(), NOW());
