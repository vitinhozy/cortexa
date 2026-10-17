import type { Question } from '@/types/domain';
function options(texts: string[], correct: number, explanations: string[]) {
  return texts.map((text, i) => ({
    id: 'ABCDE'[i],
    text,
    explanation:
      explanations[i] ??
      (i === correct
        ? 'Corresponde ao mecanismo descrito.'
        : 'Não corresponde ao mecanismo descrito.'),
  }));
}
export const questions: Question[] = [
  {
    id: 'q-acid-1',
    topicId: 'acid',
    prompt:
      'Em um caso fictício, um paciente de 45 anos apresenta pH arterial de 7,28 e bicarbonato reduzido. Considerando uma acidose metabólica simples, qual resposta compensatória é esperada?',
    options: options(
      [
        'Hipoventilação com aumento da PaCO₂',
        'Hiperventilação com redução da PaCO₂',
        'Redução imediata da excreção de ácidos',
        'Aumento primário da PaCO₂',
        'Ausência de resposta ventilatória',
      ],
      1,
      [
        'A retenção de CO₂ agravaria a acidemia.',
        'A hiperventilação reduz a PaCO₂ e atenua a queda do pH.',
        'Reter ácidos não compensa a acidose.',
        'O aumento primário da PaCO₂ caracteriza um componente respiratório acidótico.',
        'O sistema respiratório participa da compensação.',
      ],
    ),
    correctOptionId: 'B',
    explanation:
      'O distúrbio primário é a queda do bicarbonato. A resposta respiratória esperada é aumentar a ventilação, reduzindo o CO₂. A adequação da compensação exige a análise da gasometria completa.',
    difficulty: 'Média',
    source: 'Banco demonstrativo Cortexa · questão fictícia 01',
    probableCause: 'Confusão entre compensação respiratória e distúrbio respiratório primário.',
  },
  {
    id: 'q-acid-2',
    topicId: 'acid',
    prompt:
      'Em uma revisão de gasometria, qual alteração define o componente primário de uma acidose metabólica?',
    options: options(
      [
        'Aumento do bicarbonato',
        'Aumento isolado da PaCO₂',
        'Redução do bicarbonato',
        'Aumento do pH',
        'Redução da frequência respiratória',
      ],
      2,
      [
        'O bicarbonato elevado aponta para outro mecanismo.',
        'Isso corresponde a um componente respiratório.',
        'O bicarbonato reduzido é o componente metabólico primário.',
        'Acidose tende a reduzir o pH, embora distúrbios mistos possam coexistir.',
        'A frequência respiratória não define o componente metabólico.',
      ],
    ),
    correctOptionId: 'C',
    explanation:
      'Na acidose metabólica há redução primária de bicarbonato. A PaCO₂ pode cair como compensação respiratória.',
    difficulty: 'Fácil',
    source: 'Banco demonstrativo Cortexa · questão fictícia 02',
    probableCause: 'Troca entre o componente metabólico e o respiratório.',
  },
  {
    id: 'q-potassium',
    topicId: 'potassium',
    prompt:
      'Em um modelo fisiológico simplificado, qual efeito da aldosterona é esperado no néfron distal?',
    options: options(
      [
        'Menor reabsorção de sódio',
        'Menor secreção de potássio',
        'Bloqueio da ação da insulina',
        'Maior secreção de potássio',
        'Interrupção da filtração',
      ],
      3,
      [
        'A aldosterona favorece reabsorção de sódio.',
        'O efeito esperado é o oposto.',
        'Esse não é o mecanismo renal da aldosterona.',
        'A aldosterona favorece secreção distal de potássio.',
        'A filtração não é interrompida pela aldosterona.',
      ],
    ),
    correctOptionId: 'D',
    explanation:
      'A aldosterona favorece reabsorção de sódio e secreção de potássio no néfron distal.',
    difficulty: 'Média',
    source: 'Banco demonstrativo Cortexa · questão fictícia 03',
    probableCause: 'Inversão dos efeitos da aldosterona sobre sódio e potássio.',
  },
  {
    id: 'q-aki',
    topicId: 'aki',
    prompt:
      'Em um caso didático fictício, uma redução importante do volume circulante diminui a perfusão renal, sem lesão estrutural inicial. Qual categoria explica melhor a alteração?',
    options: options(
      [
        'Pré-renal',
        'Pós-renal',
        'Glomerular inflamatória',
        'Obstrução ureteral',
        'Síndrome nefrótica',
      ],
      0,
      [
        'A redução de perfusão caracteriza um mecanismo pré-renal.',
        'Pós-renal implica obstrução ao fluxo.',
        'Não há inflamação descrita no enunciado.',
        'Não há obstrução descrita.',
        'O enunciado não descreve perda proteica.',
      ],
    ),
    correctOptionId: 'A',
    explanation:
      'A redução da perfusão sem dano estrutural inicial é um mecanismo pré-renal. O exemplo é simplificado e exclusivamente educacional.',
    difficulty: 'Fácil',
    source: 'Banco demonstrativo Cortexa · questão fictícia 04',
    probableCause: 'Dificuldade em classificar as causas de injúria renal aguda.',
  },
  {
    id: 'q-filtration',
    topicId: 'filtration',
    prompt: 'Qual força favorece diretamente a filtração nos capilares glomerulares?',
    options: options(
      [
        'Pressão oncótica plasmática',
        'Pressão hidrostática na cápsula',
        'Pressão hidrostática capilar glomerular',
        'Reabsorção distal de sódio',
        'Secreção de potássio',
      ],
      2,
      [
        'A pressão oncótica plasmática se opõe à filtração.',
        'A pressão na cápsula se opõe à filtração.',
        'A pressão hidrostática capilar impulsiona o filtrado em direção à cápsula.',
        'É um processo tubular posterior.',
        'É um processo tubular posterior.',
      ],
    ),
    correctOptionId: 'C',
    explanation:
      'A pressão hidrostática dos capilares glomerulares favorece a formação do ultrafiltrado.',
    difficulty: 'Fácil',
    source: 'Banco demonstrativo Cortexa · questão fictícia 05',
    probableCause: 'Confusão entre forças favoráveis e contrárias à filtração.',
  },
  {
    id: 'q-raas',
    topicId: 'raas',
    prompt: 'Qual substância inicia a cascata do SRAA ao atuar sobre o angiotensinogênio?',
    options: options(['Insulina', 'Renina', 'Albumina', 'Bicarbonato', 'Hemoglobina'], 1, [
      'A insulina não inicia essa cascata.',
      'A renina converte angiotensinogênio em angiotensina I.',
      'A albumina participa da pressão oncótica.',
      'O bicarbonato é um tampão.',
      'A hemoglobina transporta oxigênio.',
    ]),
    correctOptionId: 'B',
    explanation: 'A renina, liberada pelas células justaglomerulares, inicia a cascata do SRAA.',
    difficulty: 'Fácil',
    source: 'Banco demonstrativo Cortexa · questão fictícia 06',
    probableCause: 'Dificuldade em ordenar as etapas do SRAA.',
  },
  {
    id: 'q-nephrotic',
    topicId: 'nephrotic',
    prompt: 'Qual conjunto representa melhor o padrão nefrótico em um exemplo didático?',
    options: options(
      [
        'Hematúria isolada',
        'Proteinúria importante, hipoalbuminemia e edema',
        'Hiperventilação isolada',
        'Obstrução ureteral',
        'Aumento isolado do potássio',
      ],
      1,
      [
        'Não reúne os elementos do padrão nefrótico.',
        'Esse conjunto caracteriza o padrão nefrótico.',
        'É um achado respiratório.',
        'Descreve mecanismo pós-renal.',
        'Não caracteriza síndrome nefrótica.',
      ],
    ),
    correctOptionId: 'B',
    explanation:
      'A perda urinária de proteínas e a hipoalbuminemia são elementos centrais do padrão nefrótico.',
    difficulty: 'Média',
    source: 'Banco demonstrativo Cortexa · questão fictícia 07',
    probableCause: 'Confusão entre os padrões nefrótico e nefrítico.',
  },
  {
    id: 'q-nephritic',
    topicId: 'nephritic',
    prompt:
      'Qual achado sugere origem glomerular da hematúria em um modelo didático de síndrome nefrítica?',
    options: options(
      [
        'Glicosúria isolada',
        'Bicarbonato elevado',
        'Cilindros hemáticos',
        'Hiperventilação',
        'Albumina sérica elevada',
      ],
      2,
      [
        'Não identifica origem glomerular da hematúria.',
        'Não identifica a origem da hematúria.',
        'Cilindros hemáticos sugerem sangramento de origem glomerular.',
        'É um achado respiratório.',
        'Não caracteriza inflamação glomerular.',
      ],
    ),
    correctOptionId: 'C',
    explanation: 'Cilindros hemáticos apoiam a hipótese de origem glomerular da hematúria.',
    difficulty: 'Média',
    source: 'Banco demonstrativo Cortexa · questão fictícia 08',
    probableCause: 'Dificuldade em reconhecer achados de inflamação glomerular.',
  },
];
