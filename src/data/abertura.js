// Abertura de empresa — seed data (mock local, sem persistência nesta fase).
// Portado do protótipo docs/workflow/prototipo-fluxo-abertura-empresa.html.
// Colunas = Etapas, cards = Empresas, itens do checklist = Passos.

export const PIPELINES = {
  abertura: {
    label: 'Abertura de empresa',
    columns: [
      { id: 'jornada', label: 'Jornada de abertura', steps: ['Envio da jornada', 'Documentos recebidos', 'Validação dos documentos'] },
      { id: 'viabilidade', label: 'Viabilidade', steps: ['Nova viabilidade', 'Preencher informações do estabelecimento e empresarial', 'Transmitir viabilidade', 'Salvar protocolo Redesim'] },
      { id: 'dbe', label: 'Coletor Nacional (DBE)', steps: ['Informar protocolo', 'Dados dos sócios', 'Informações complementares', 'Transmitir DBE', 'Confirmação Receita Federal'] },
      { id: 'contrato', label: 'Contrato social', steps: ['Informar protocolo', 'Confirmar dados dos sócios e da empresa', 'Formular contrato social', 'Recolher e pagar a DARE', 'Coletar assinatura de documentos e contratos', 'Inserir documentos no sistema', 'Aguardar aprovação e salvar documentos'] },
      { id: 'certificado', label: 'Certificado digital', steps: ['Enviar informações do cliente para Juliana', 'Informar cliente sobre horários disponíveis', 'Acompanhar agendamento', 'Instalar certificado'] },
      { id: 'simples', label: 'Opção pelo Simples', steps: ['Confirmar registro da empresa no Simples Nacional', 'Coletar assinaturas'] },
      { id: 'municipal', label: 'Inscrição municipal', steps: ['Desbloquear CCM', 'Confirmar dados', 'Salvar CCM'] },
      { id: 'licenciamento', label: 'Licenciamento', steps: ['Preencher dados', 'Responder perguntas sobre licenciamento'] },
      { id: 'susep', label: 'Cadastro SUSEP', steps: ['Acessar SUSEP do corretor', 'Preencher dados da empresa'] },
      { id: 'finalizacao', label: 'Finalização', steps: ['Enviar documentos e informações ao cliente', 'Onboarding de processos', 'Assinatura do contrato'] },
    ],
  },
  transferencia: {
    label: 'Cliente com empresa (transferência)',
    columns: [
      { id: 'transferencia', label: 'Transferência de contabilidade', steps: ['Assinatura do contrato', 'Pedido de transferência para a antiga contabilidade', 'Conferir documentação'] },
      { id: 'onboarding', label: 'Onboarding', steps: ['Iniciar serviços contábeis', 'Configurar acessos do cliente'] },
      { id: 'notas', label: 'Notas fiscais', hint: 'Dia 1 ao dia 5', steps: ['Apurar comissões', 'Apurar outras receitas', 'Emitir NFs', 'Importar NFs ao sistema'] },
      { id: 'das', label: 'DAS', hint: 'Dia 10 ao dia 15', steps: ['Transmitir pelo sistema', 'Salvar nos arquivos'] },
      { id: 'faturamento', label: 'Faturamento anual', steps: ['Apurar faturamento anual', 'Salvar nos arquivos'] },
      { id: 'pendencias', label: 'Controle de pendências', steps: ['Verificar E-CAC', 'Verificar DUC', 'Verificar DEC'] },
    ],
  },
};




// Paleta de avatares alinhada ao DS do projeto (verde/gold como primária).
const AVATAR_COLORS = ['#13A170', '#3A5867', '#9B742D', '#5B2E91', '#0066B3', '#C2453A'];

export function getInitials(name) {
  const parts = String(name).trim().split(/\s+/);
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
  return letters.toUpperCase();
}

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// Deriva progresso (%) e status (tag) a partir dos itens concluídos do checklist.
export function statusOf(checked) {
  const total = checked.length;
  const done = checked.filter(Boolean).length;
  if (total === 0 || done === 0) return { pct: 0, tagStatus: 'neutral', tagLabel: 'Não iniciado' };
  if (done === total) return { pct: 100, tagStatus: 'success', tagLabel: 'Concluído' };
  return { pct: Math.round((done / total) * 100), tagStatus: 'info', tagLabel: 'Em andamento' };
}
