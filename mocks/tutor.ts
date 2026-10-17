export const tutorSteps = [
  {
    question:
      'Antes de explicar acidose metabólica, vamos verificar uma coisa. O que acontece com o bicarbonato nesse distúrbio?',
    options: ['Ele diminui', 'Ele aumenta', 'Ele não muda'],
    correct: 0,
    success: 'Exatamente. A queda do bicarbonato é o componente metabólico primário.',
    retry: 'Pense no bicarbonato como uma base. Na acidose metabólica, sua concentração diminui.',
  },
  {
    question:
      'Agora conecte com a respiração: para compensar essa queda, o organismo tende a fazer o quê?',
    options: ['Reduzir a ventilação', 'Aumentar a ventilação', 'Interromper a excreção renal'],
    correct: 1,
    success: 'Isso. A hiperventilação reduz o CO₂ e ajuda a atenuar a acidemia.',
    retry:
      'Reter CO₂ agravaria a acidemia. A resposta esperada é aumentar a ventilação e reduzir a PaCO₂.',
  },
  {
    question:
      'Uma PaCO₂ reduzida nesse contexto significa, necessariamente, uma alcalose respiratória primária?',
    options: [
      'Sim, sempre',
      'Não; pode ser a compensação esperada',
      'O CO₂ não participa do equilíbrio',
    ],
    correct: 1,
    success:
      'Muito bem. É preciso avaliar a compensação esperada antes de concluir que há um distúrbio misto.',
    retry:
      'Não necessariamente. A queda da PaCO₂ pode ser uma resposta compensatória. O contexto e os valores esperados ajudam a distinguir os mecanismos.',
  },
];
