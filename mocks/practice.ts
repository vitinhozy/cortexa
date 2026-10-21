import type { Question } from '@/types/domain';
import type { QuestionFormat } from '@/types/practice';

/** Original fictional teaching items. These are fixtures, never generated from an uploaded file. */
function item(
  id: string,
  concept: string,
  name: string,
  level: 1 | 2 | 3 | 4 | 5,
  format: QuestionFormat,
  prompt: string,
  correct: string,
  wrong: [string, string][],
  explanation: string,
): Question {
  const position = Number(id.split('-').at(-1)) % 4;
  const answers = [...wrong];
  answers.splice(position, 0, [correct, explanation]);
  return {
    id: `practice-demo-${id}`,
    topicId: 'acid',
    conceptId: concept,
    conceptName: name,
    level,
    format,
    difficulty: level <= 2 ? 'Fácil' : level === 3 ? 'Média' : 'Difícil',
    prompt,
    options: answers.map(([text, detail], index) => ({
      id: 'ABCD'[index],
      text,
      explanation: detail,
    })),
    correctOptionId: 'ABCD'[position],
    explanation,
    source: 'Banco demonstrativo Cortexa · exercício fictício, sem material enviado',
    probableCause:
      concept === 'acid-gap'
        ? 'Hipótese didática: confira a expressão do ânion gap, a soma dos eletrólitos e a influência da albumina antes de interpretar o resultado.'
        : concept === 'acid-primary'
          ? 'Hipótese didática: diferencie o componente que iniciou o distúrbio da resposta compensatória.'
          : concept === 'acid-respiratory'
            ? 'Hipótese didática: diferencie a ação da PaCO₂ sobre o pH do componente metabólico.'
            : `Hipótese didática: reveja ${name.toLocaleLowerCase('pt-BR')} e compare o valor observado com a resposta compensatória esperada.`,
  };
}
const primary = 'acid-primary';
const compensation = 'acid-compensation';
const gap = 'acid-gap';
const mixed = 'acid-mixed';
const respiratory = 'acid-respiratory';
export const practiceDemoQuestions: Question[] = [
  item(
    'primary-1',
    primary,
    'Distúrbio primário',
    1,
    'concept',
    'Ao organizar a interpretação de uma gasometria, o que o pH informa primeiro?',
    'Se há acidemia ou alcalemia.',
    [
      ['Qual órgão causou o distúrbio.', 'O pH sozinho não identifica o mecanismo ou o órgão.'],
      [
        'Se a compensação é adequada.',
        'É preciso comparar os componentes e a compensação esperada.',
      ],
      ['O valor do ânion gap.', 'O gap é calculado com eletrólitos.'],
    ],
    'O pH descreve acidemia ou alcalemia. Depois, os componentes metabólico e respiratório ajudam a identificar o distúrbio primário.',
  ),
  item(
    'primary-2',
    primary,
    'Distúrbio primário',
    2,
    'application',
    'Uma redução primária do bicarbonato tende a produzir qual alteração ácido-base?',
    'Acidose metabólica.',
    [
      ['Alcalose metabólica.', 'A alcalose metabólica envolve aumento primário de bicarbonato.'],
      ['Alcalose respiratória.', 'O componente primário respiratório é a PaCO₂.'],
      ['Acidose respiratória.', 'Na acidose respiratória, a PaCO₂ sobe primariamente.'],
    ],
    'A redução primária do bicarbonato caracteriza a acidose metabólica. A resposta ventilatória é avaliada separadamente.',
  ),
  item(
    'primary-3',
    primary,
    'Distúrbio primário',
    3,
    'laboratory',
    'Exemplo fictício: pH 7,30, HCO₃⁻ 15 mmol/L e PaCO₂ 31 mmHg. Qual componente aponta para o distúrbio metabólico primário?',
    'HCO₃⁻ reduzido.',
    [
      [
        'PaCO₂ reduzida como prova de acidose respiratória.',
        'Uma PaCO₂ reduzida tem efeito alcalinizante.',
      ],
      ['pH isolado como prova de origem renal.', 'O pH não identifica a origem renal.'],
      [
        'Ausência de distúrbio porque a PaCO₂ caiu.',
        'A compensação não elimina o distúrbio primário.',
      ],
    ],
    'Há acidemia com bicarbonato reduzido. A PaCO₂ baixa pode representar compensação; sua adequação deve ser verificada.',
  ),
  item(
    'primary-4',
    primary,
    'Distúrbio primário',
    4,
    'clinical',
    'Caso fictício: após perdas intestinais importantes, uma pessoa apresenta acidemia e HCO₃⁻ baixo. Qual mecanismo é compatível com o componente metabólico?',
    'Perda de bicarbonato.',
    [
      ['Retenção primária de CO₂.', 'Isso é um mecanismo respiratório.'],
      ['Ganho primário de bicarbonato.', 'Teria efeito alcalinizante.'],
      [
        'Hiperventilação como causa da acidemia.',
        'Hiperventilação reduz CO₂ e tem efeito alcalinizante.',
      ],
    ],
    'Perdas intestinais de bicarbonato podem produzir acidose metabólica. O caso não basta para definir etiologia completa ou conduta.',
  ),
  item(
    'compensation-1',
    compensation,
    'Compensação respiratória',
    1,
    'concept',
    'Na acidose metabólica simples, qual direção da resposta ventilatória ajuda a atenuar a acidemia?',
    'Aumentar a ventilação e reduzir a PaCO₂.',
    [
      ['Diminuir a ventilação e reter CO₂.', 'Reter CO₂ agravaria a acidemia.'],
      ['Aumentar a PaCO₂ primariamente.', 'Isso acrescentaria um efeito acidificante.'],
      ['Interromper a ventilação.', 'A ventilação é necessária para eliminar CO₂.'],
    ],
    'A ventilação aumentada reduz a PaCO₂. Isso atenua a acidemia sem corrigir a causa da redução do bicarbonato.',
  ),
  item(
    'compensation-2',
    compensation,
    'Compensação respiratória',
    2,
    'mechanism',
    'Por que a hiperventilação pode compensar parcialmente uma acidose metabólica?',
    'Ela aumenta a eliminação de CO₂.',
    [
      [
        'Ela produz bicarbonato diretamente no alvéolo.',
        'O efeito ventilatório direto é sobre CO₂.',
      ],
      ['Ela aumenta a produção de ácidos fixos.', 'Isso não explicaria a compensação.'],
      ['Ela impede qualquer distúrbio misto.', 'Um distúrbio misto pode coexistir.'],
    ],
    'A eliminação de CO₂ reduz o componente ácido respiratório. Compensação e tratamento da causa são conceitos diferentes.',
  ),
  item(
    'compensation-3',
    compensation,
    'Compensação respiratória',
    3,
    'laboratory',
    'Exercício fictício: HCO₃⁻ 12 mmol/L. Usando PaCO₂ esperada = 1,5 × HCO₃⁻ + 8 ± 2, qual intervalo é esperado?',
    '24–28 mmHg.',
    [
      ['38–42 mmHg.', 'Calcule 1,5 × 12 + 8 e aplique ± 2.'],
      ['10–14 mmHg.', 'Esse intervalo não resulta da fórmula apresentada.'],
      ['48–52 mmHg.', 'Esse intervalo é muito superior ao resultado da fórmula.'],
    ],
    '1,5 × 12 + 8 = 26. Com a margem apresentada, espera-se 24–28 mmHg. É uma estimativa, não uma regra de tratamento.',
  ),
  item(
    'compensation-4',
    compensation,
    'Compensação respiratória',
    4,
    'clinical',
    'Caso fictício de acidose metabólica: a PaCO₂ está dentro do intervalo compensatório calculado. O que isso apoia?',
    'Uma resposta respiratória compatível com a compensação esperada.',
    [
      ['Ausência de acidose metabólica.', 'Compensação não elimina o distúrbio metabólico.'],
      [
        'Prova de dois distúrbios respiratórios.',
        'Estar no intervalo esperado não demonstra isso.',
      ],
      [
        'Necessidade de uma conduta específica sem mais dados.',
        'A avaliação clínica completa continua necessária.',
      ],
    ],
    'A concordância com o intervalo esperado apoia compensação adequada para o componente respiratório, sem substituir a investigação do caso.',
  ),
  item(
    'compensation-5',
    compensation,
    'Compensação respiratória',
    5,
    'integration',
    'Exercício fictício: HCO₃⁻ 16, PaCO₂ 32. A fórmula fornecida é 1,5 × HCO₃⁻ + 8 ± 2. Como interpretar o componente respiratório?',
    'PaCO₂ dentro da faixa compensatória de 30–34.',
    [
      ['Acidose respiratória adicional obrigatória.', '32 está dentro da faixa calculada.'],
      [
        'Alcalose respiratória adicional obrigatória.',
        'A PaCO₂ não está abaixo da faixa apresentada.',
      ],
      [
        'Ausência de componente metabólico.',
        'HCO₃⁻ reduzido pode ser o componente metabólico primário.',
      ],
    ],
    'A conta resulta em 32 ± 2. A PaCO₂ de 32 é compatível com a compensação esperada.',
  ),
  item(
    'gap-1',
    gap,
    'Ânion gap',
    1,
    'concept',
    'Sem incluir potássio, qual expressão calcula o ânion gap sérico?',
    'Na⁺ − (Cl⁻ + HCO₃⁻).',
    [
      ['Na⁺ + Cl⁻ + HCO₃⁻.', 'O cálculo compara cátions medidos com ânions medidos.'],
      ['PaCO₂ − pH.', 'Essas grandezas não calculam o ânion gap.'],
      ['HCO₃⁻ − Na⁺.', 'É preciso incluir o cloreto na diferença.'],
    ],
    'A expressão sem potássio é Na⁺ − (Cl⁻ + HCO₃⁻). A interpretação depende do laboratório e do contexto, incluindo a albumina.',
  ),
  item(
    'gap-2',
    gap,
    'Ânion gap',
    2,
    'application',
    'Qual alteração pode reduzir o ânion gap observado e mascarar sua elevação?',
    'Hipoalbuminemia.',
    [
      [
        'Hiperlactatemia com albumina normal.',
        'O lactato pode aumentar os ânions não medidos e elevar o gap.',
      ],
      ['Cetoacidose com albumina normal.', 'Os cetoânions contribuem para elevação do gap.'],
      [
        'Retenção de ácidos não medidos com albumina normal.',
        'Esse mecanismo tende a aumentar o gap.',
      ],
    ],
    'A albumina contribui para os ânions não medidos. Sua redução pode diminuir o ânion gap observado.',
  ),
  item(
    'gap-3',
    gap,
    'Ânion gap',
    3,
    'laboratory',
    'Exercício fictício: Na⁺ 140, Cl⁻ 104 e HCO₃⁻ 12 mmol/L. Sem potássio, qual é o ânion gap?',
    '24 mmol/L.',
    [
      ['12 mmol/L.', 'Some 104 + 12 antes de subtrair de 140.'],
      ['36 mmol/L.', 'O bicarbonato deve ser somado ao cloreto na subtração.'],
      ['256 mmol/L.', 'A expressão usa diferença, não a soma de todos os valores.'],
    ],
    '140 − (104 + 12) = 24 mmol/L. A interpretação clínica requer o intervalo de referência e a albumina.',
  ),
  item(
    'gap-4',
    gap,
    'Ânion gap',
    4,
    'differential',
    'Em um caso fictício de acidose metabólica, o gap calculado está elevado. Qual raciocínio é mais apropriado?',
    'Investigar acúmulo de ânions não medidos e integrar o contexto.',
    [
      ['Concluir automaticamente uma única etiologia.', 'Diferentes processos podem elevar o gap.'],
      [
        'Excluir toda acidose metabólica.',
        'O gap é usado justamente na classificação das acidoses.',
      ],
      ['Interpretar o gap sem considerar albumina.', 'A albumina influencia o valor observado.'],
    ],
    'Um gap elevado orienta a busca de ânions não medidos, mas não define sozinho a etiologia.',
  ),
  item(
    'mixed-1',
    mixed,
    'Distúrbios mistos',
    1,
    'concept',
    'O que distingue um distúrbio misto de uma resposta compensatória esperada?',
    'A presença de mais de um processo primário.',
    [
      ['Qualquer queda da PaCO₂.', 'Uma queda da PaCO₂ pode ser compensatória.'],
      [
        'Qualquer alteração do bicarbonato.',
        'O bicarbonato pode mudar como resposta compensatória.',
      ],
      [
        'Um pH necessariamente normal.',
        'O pH pode estar alto, baixo ou próximo do intervalo de referência.',
      ],
    ],
    'Distúrbios mistos têm processos primários coexistentes. É preciso comparar as respostas com a compensação esperada.',
  ),
  item(
    'mixed-2',
    mixed,
    'Distúrbios mistos',
    3,
    'laboratory',
    'Exercício fictício: na acidose metabólica, espera-se PaCO₂ 24–28, mas mede-se 40 mmHg. Qual hipótese deve ser considerada?',
    'Acidose respiratória associada.',
    [
      ['Compensação respiratória dentro do esperado.', '40 está acima da faixa informada.'],
      ['Alcalose respiratória associada.', 'Ela reduziria a PaCO₂ para abaixo do esperado.'],
      ['Ausência de componente respiratório.', 'A discrepância da PaCO₂ exige avaliação.'],
    ],
    'Uma PaCO₂ acima do esperado na acidose metabólica sugere componente de acidose respiratória associado.',
  ),
  item(
    'mixed-3',
    mixed,
    'Distúrbios mistos',
    4,
    'clinical',
    'Caso fictício: HCO₃⁻ reduzido com PaCO₂ abaixo da faixa compensatória esperada. Que combinação é compatível?',
    'Acidose metabólica com alcalose respiratória.',
    [
      [
        'Acidose metabólica com acidose respiratória.',
        'Acidose respiratória elevaria a PaCO₂ em relação ao esperado.',
      ],
      [
        'Alcalose metabólica isolada.',
        'O bicarbonato reduzido não apoia esse componente primário.',
      ],
      [
        'Compensação adequada por definição.',
        'É necessário respeitar a faixa compensatória informada.',
      ],
    ],
    'A PaCO₂ inferior à esperada sugere alcalose respiratória além da resposta compensatória.',
  ),
  item(
    'mixed-4',
    mixed,
    'Distúrbios mistos',
    5,
    'integration',
    'Caso fictício: pH no intervalo de referência, mas PaCO₂ e HCO₃⁻ claramente alterados. Qual é o próximo raciocínio?',
    'Examinar os componentes e as compensações antes de concluir normalidade.',
    [
      [
        'Encerrar a análise porque o pH está normal.',
        'Processos opostos podem aproximar o pH do intervalo de referência.',
      ],
      [
        'Concluir que não existem alterações metabólicas.',
        'O bicarbonato está alterado e precisa ser interpretado.',
      ],
      ['Escolher uma conduta com base apenas no pH.', 'Não há dados suficientes para uma conduta.'],
    ],
    'Um pH próximo do intervalo de referência não exclui compensação ou processos mistos. Os componentes devem ser avaliados em conjunto.',
  ),
  item(
    'respiratory-1',
    respiratory,
    'Componente respiratório',
    1,
    'concept',
    'Qual variável representa diretamente o componente respiratório na análise ácido-base?',
    'PaCO₂.',
    [
      ['Sódio isolado.', 'É utilizado no cálculo do gap, não como componente respiratório.'],
      ['Albumina isolada.', 'Influencia ânions não medidos.'],
      ['Contagem de plaquetas.', 'Não define o componente respiratório da gasometria.'],
    ],
    'A PaCO₂ representa o componente respiratório. O bicarbonato ajuda a avaliar o componente metabólico.',
  ),
  item(
    'respiratory-2',
    respiratory,
    'Componente respiratório',
    2,
    'mechanism',
    'Em um modelo simples, qual efeito imediato da retenção de CO₂ sobre o equilíbrio ácido-base?',
    'Efeito acidificante.',
    [
      ['Efeito alcalinizante primário.', 'Reduzir CO₂, e não retê-lo, tem efeito alcalinizante.'],
      ['Nenhuma relação com o pH.', 'CO₂ participa do sistema bicarbonato.'],
      ['Aumento obrigatório do ânion gap.', 'Retenção de CO₂ não obriga aumento do gap.'],
    ],
    'A elevação primária da PaCO₂ produz um componente respiratório acidótico.',
  ),
  item(
    'respiratory-3',
    respiratory,
    'Componente respiratório',
    3,
    'laboratory',
    'Exercício fictício: pH 7,50 e PaCO₂ 28 mmHg. Qual componente contribui para a alcalemia?',
    'Um componente respiratório alcalótico.',
    [
      ['Um componente respiratório acidótico.', 'PaCO₂ baixa tem efeito alcalinizante.'],
      ['Acidose metabólica demonstrada apenas pelo pH.', 'O pH isolado não demonstra essa origem.'],
      ['Ausência de alteração respiratória.', 'A PaCO₂ apresentada está reduzida.'],
    ],
    'A PaCO₂ reduzida é compatível com um componente de alcalose respiratória. O bicarbonato e o contexto completam a interpretação.',
  ),
  item(
    'respiratory-4',
    respiratory,
    'Componente respiratório',
    4,
    'clinical',
    'Caso fictício: há retenção primária sustentada de CO₂. Qual sistema participa de uma compensação mais lenta?',
    'O sistema renal, ajustando o balanço de bicarbonato e ácidos.',
    [
      [
        'Somente os tampões imediatos, sem participação renal.',
        'Os tampões participam da resposta inicial; a compensação sustentada também envolve os rins.',
      ],
      [
        'Retenção adicional de CO₂ como mecanismo de correção da acidemia.',
        'Retenção adicional de CO₂ teria efeito acidificante.',
      ],
      [
        'Excreção renal obrigatória de bicarbonato como compensação.',
        'A compensação renal da retenção sustentada de CO₂ tende a aumentar o bicarbonato plasmático, não a promover sua perda como resposta compensatória.',
      ],
    ],
    'A compensação renal é mais lenta que a resposta ventilatória. Não equivale à resolução da causa da retenção de CO₂.',
  ),
];

const progressiveCase = [
  item(
    'progressive-1',
    primary,
    'Distúrbio primário',
    3,
    'progressive',
    'Caso fictício, etapa 1: uma gasometria apresenta pH 7,26, HCO₃⁻ 12 mmol/L e PaCO₂ 28 mmHg. Qual distúrbio primário explica a acidemia?',
    'Acidose metabólica.',
    [
      ['Alcalose metabólica.', 'O bicarbonato reduzido não apoia aumento primário de base.'],
      ['Acidose respiratória isolada.', 'A PaCO₂ apresentada não está elevada.'],
      ['Ausência de distúrbio.', 'O pH descreve acidemia e o bicarbonato está reduzido.'],
    ],
    'O pH mostra acidemia, e o bicarbonato reduzido aponta para o componente metabólico primário. A análise ainda deve conferir a compensação.',
  ),
  item(
    'progressive-2',
    gap,
    'Ânion gap',
    4,
    'progressive',
    'O mesmo caso fictício, etapa 2: agora foram informados Na⁺ 140, Cl⁻ 104 e HCO₃⁻ 12 mmol/L. Qual é o ânion gap, sem incluir potássio?',
    '24 mmol/L.',
    [
      ['12 mmol/L.', 'Subtraia de 140 a soma de cloreto e bicarbonato.'],
      ['36 mmol/L.', 'Cloreto e bicarbonato devem ser somados antes da subtração.'],
      ['256 mmol/L.', 'O gap é uma diferença, não a soma dos valores.'],
    ],
    '140 − (104 + 12) = 24 mmol/L. O dado adicional ajuda a classificar o componente metabólico; referência laboratorial, albumina e contexto continuam necessários.',
  ),
].map((question, index) => ({ ...question, caseGroupId: 'case-acid-demo', caseStep: index + 1 }));
practiceDemoQuestions.push(...progressiveCase);

export function annotateDemoQuestion(question: Question): Question {
  if (question.id === 'q-acid-1')
    return {
      ...question,
      conceptId: compensation,
      conceptName: 'Compensação respiratória',
      level: 4,
      format: 'clinical',
      prerequisiteConceptId: primary,
    };
  if (question.id === 'q-acid-2')
    return {
      ...question,
      conceptId: primary,
      conceptName: 'Distúrbio primário',
      level: 1,
      format: 'concept',
    };
  return {
    ...question,
    conceptId: question.topicId,
    level: question.difficulty === 'Fácil' ? 1 : question.difficulty === 'Difícil' ? 4 : 3,
    format: question.id === 'q-aki' ? 'clinical' : 'mechanism',
  };
}
