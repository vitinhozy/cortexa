import { subjectCatalog } from '@/constants/subjects';
import type { Topic, Subject } from '@/types/domain';
export const subjects: Subject[] = subjectCatalog.map((subject) => ({ ...subject }));
export const topics: Topic[] = [
  {
    id: 'acid',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'Equilíbrio ácido-base',
    summary:
      'O equilíbrio ácido-base depende da integração entre tampões, ventilação e função renal. Comece pelo pH, identifique o componente primário e só então avalie a compensação.',
    keyPoints: [
      'pH abaixo de 7,35 indica acidemia; acima de 7,45, alcalemia.',
      'Na acidose metabólica, o bicarbonato cai e a ventilação tende a aumentar.',
      'Compensação não é sinônimo de um segundo distúrbio primário.',
    ],
  },
  {
    id: 'potassium',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'Distúrbios do potássio',
    summary:
      'A concentração de potássio depende da distribuição entre os compartimentos e da excreção renal. A aldosterona aumenta a secreção distal de potássio.',
    keyPoints: [
      'A maior parte do potássio está no meio intracelular.',
      'Insulina favorece a entrada de potássio nas células.',
      'O néfron distal participa do ajuste da excreção de potássio.',
    ],
  },
  {
    id: 'aki',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'Injúria renal aguda',
    summary:
      'A injúria renal aguda é uma redução abrupta da função renal. Organize o raciocínio em causas pré-renais, intrínsecas e pós-renais.',
    keyPoints: [
      'Pré-renal: redução da perfusão renal.',
      'Intrínseca: lesão do parênquima renal.',
      'Pós-renal: obstrução ao fluxo urinário.',
    ],
  },
  {
    id: 'filtration',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'Filtração glomerular',
    summary:
      'A filtração glomerular resulta das forças hidrostáticas e oncóticas através da barreira glomerular.',
    keyPoints: [
      'A pressão hidrostática capilar favorece a filtração.',
      'A pressão oncótica plasmática se opõe à filtração.',
      'A barreira limita a passagem de células e grandes proteínas.',
    ],
  },
  {
    id: 'raas',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'SRAA',
    summary:
      'O sistema renina–angiotensina–aldosterona integra perfusão renal, pressão arterial e balanço de sódio.',
    keyPoints: [
      'A renina inicia a cascata a partir do angiotensinogênio.',
      'A angiotensina II promove vasoconstrição e estimula aldosterona.',
      'A aldosterona favorece reabsorção de sódio e secreção de potássio.',
    ],
  },
  {
    id: 'nephrotic',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'Síndrome nefrótica',
    summary:
      'A síndrome nefrótica combina perda importante de proteínas na urina, hipoalbuminemia e edema.',
    keyPoints: [
      'A perda de proteínas reflete alteração da barreira glomerular.',
      'A redução da pressão oncótica contribui para o edema.',
      'Diferencie o padrão nefrótico do inflamatório nefrítico.',
    ],
  },
  {
    id: 'nephritic',
    subjectId: 'physiology',
    unit: 'Fisiologia Renal',
    name: 'Síndrome nefrítica',
    summary:
      'O padrão nefrítico decorre de inflamação glomerular e pode incluir hematúria, hipertensão e redução da filtração.',
    keyPoints: [
      'Hematúria é uma característica importante.',
      'Cilindros hemáticos sugerem origem glomerular.',
      'A retenção de sódio e água pode contribuir para hipertensão.',
    ],
  },
];
