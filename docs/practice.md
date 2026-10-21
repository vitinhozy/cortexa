# Questões e Simulados

## Fluxo

`Estudar → Questões → preparação → conteúdo → conceitos → configuração → sessão → análise → revisão`.

A entrada oferece continuidade baseada em materiais, chats, documentos e atividades do espaço atual; revisão de pontos fracos; seleção múltipla de fontes; texto novo; busca de assunto e diagnóstico. Links com assunto ou questão abrem a configuração sem iniciar a prova automaticamente.

Aprender/Revisar bloqueiam a alternativa escolhida e pedem confiança **antes de revelar o gabarito**, evitando viés de retrospectiva. Depois mostram explicações de todas as alternativas, conceito principal, hipótese didática de confusão e fontes. O modal de revisão mantém o aluno na sessão. Um acerto isolado não é descrito como conceito consolidado.

Simulados são montados antes de começar. É possível mudar respostas, navegar, marcar dúvidas e interromper. Não há correção nem atualização do desempenho antes da entrega. A entrega registra as respostas uma única vez e libera a análise. Questões em branco entram no denominador do resultado, sem virar tentativas inventadas.

O diagnóstico usa 5–10 questões, distribuídas entre conceitos disponíveis. Apresenta um ponto de partida, sem nota ou julgamento. Menos de cinco questões disponíveis impede iniciar um diagnóstico completo. Todas as estimativas indicam quando a evidência ainda é inicial.

## Arquitetura e estado

`AppData.practice` é opcional, mantendo snapshots v1 antigos. Contém sessões, estimativas por conceito e agenda de revisão. A sessão guarda configuração, pool congelado de questões/fontes, itens apresentados, respostas, confiança, marcações, índice atual, tempo, status e estimativas anteriores. Editar o banco não altera silenciosamente uma prova iniciada.

Estados: `active → paused → active → completed`. Criar outra sessão pausa as anteriores. A entrada oferece retomada. Simulados com limite guardam um prazo absoluto; o relógio continua durante a interrupção. Retomar uma prova expirada entrega o que já estava salvo. Na aprendizagem, o tempo ativo é estimado pelo foco da rota/AppState e gravado periodicamente; isso não mede atenção com precisão.

IDs determinísticos por sessão/questão tornam o registro idempotente. Tentativa, confiança, métrica, erro e agenda são aplicados juntos. O simulado usa a mesma transação somente na entrega. A conclusão também registra o estudo no histórico existente para calendário e minutos semanais. Recarregar o resultado não duplica tentativas ou tempo.

Os repositórios e chaves por proprietário continuam isolados. O espaço pessoal não importa conteúdo ou desempenho demonstrativo. Hidratação valida a nova estrutura e protege dados malformados contra sobrescrita. Snapshots antigos da demonstração recebem os novos fixtures e metadados de conceito sem apagar seu histórico.

## Princípios com efeito no comportamento

| Princípio                          | Implementação                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recuperação ativa / testing effect | Resposta comprometida antes da explicação.                                                                                                                                           |
| Avaliação formativa                | Explicação das alternativas e hipótese didática do erro na aprendizagem.                                                                                                             |
| Metacognição e confiança           | Certeza, dúvida e chute alteram a evidência; erro seguro recebe destaque e prioridade.                                                                                               |
| Adaptação / prática deliberada     | Dificuldade favorece variantes mais simples ou pré-requisitos; sucesso seguro aumenta a complexidade disponível.                                                                     |
| Intercalação                       | Alterna conceitos relacionados, preservando prioridade de recuperação e cobertura diagnóstica.                                                                                       |
| Aprendizagem por domínio           | Usa evidência acumulada e não confunde um acerto com consolidação.                                                                                                                   |
| Repetição espaçada                 | Agenda o conceito e prefere variantes de questões, em vez de decorar um ID.                                                                                                          |
| Raciocínio clínico                 | Fixtures variam entre conceito, mecanismo, aplicação, laboratório, diferenciação e integração. Casos progressivos preservam a ordem das etapas. O contrato permite ampliar formatos. |
| Aprender com erros                 | Caderno agrupado por conceito, com resposta, gabarito, confiança, data, exposições e revisões posteriores.                                                                           |

### Domínio e agenda

A estimativa é uma **heurística do produto, não um instrumento psicométrico ou clínico validado**. Usa até 30 tentativas por conceito; peso exponencial de recência (45 dias); dificuldade/complexidade; evidência diferente para acerto seguro, dúvida e chute; erros confiantes; sequências de acerto/erro; e redução gradual após tempo sem prática. Um prior fraco evita interpretar uma única observação como domínio. Sem tentativas, a interface mostra ausência de evidência.

O limiar de três exposições distingue estimativa inicial de evidência em desenvolvimento, sem comprovar domínio. Não se usa apenas o percentual bruto de acertos. Métricas demonstrativas antigas não são transformadas em tentativas reais.

O seletor considera domínio, vencimento, novidade, nível, erros confiantes, pré-requisitos e intercalação. Não repete um ID na mesma sessão. A quantidade efetiva respeita o número real de questões únicas; não há perguntas inventadas para atingir o pedido.

Fácil, Média e Difícil restringem o banco à dificuldade escolhida; apenas Adaptativa percorre níveis diferentes. Etapas posteriores de casos progressivos exigem as anteriores no mesmo banco.

Intervalos locais iniciais: erro em 10 minutos; acerto com dúvida/chute em um dia; acerto seguro em pelo menos três dias, expandindo até 30. Esses parâmetros são escolhas de engenharia que exigem calibração educacional. Não são FSRS/SM-2 nem intervalos universais derivados dos artigos.

## Fontes e limites

`StudySource` reúne materiais, documentos do estúdio, chats, flashcards e sessões anteriores. A autoria manual aceita conceito/subtópico, dificuldade e fontes do mesmo espaço. A interface exibe o título cadastrado. Uma página só deve ser citada quando houver metadados verificáveis. Vínculo manual não significa validação médica pelo app.

No espaço pessoal, selecionar material disponibiliza somente questões explicitamente vinculadas ou questões de origem de um flashcard/sessão. Compartilhar o assunto não basta para alegar que a questão foi gerada de um documento.

Na demonstração, arquivos fictícios podem selecionar exercícios do mesmo assunto. O aviso e as fontes explicam que o arquivo não foi lido. Itens de `mocks/practice.ts` são exercícios originais fictícios, sem casos reais, geração ao vivo ou referências clínicas fabricadas.

Texto/anotações são salvos literalmente. **Upload de PDF/slides/imagens/áudio, OCR, transcrição, estruturação semântica e geração por IA ainda dependem de integração.** Esses tipos mostram indisponibilidade; não simulam recebimento ou análise. Conteúdo sem banco pode receber questões cadastradas pelo próprio estudante. Não há progresso falso por etapas de processamento.

Voltar ao formulário e repetir o envio sem alterações reutiliza a anotação salva. Alterar título, texto ou disciplina cria outra anotação, com aviso explícito, preservando o conteúdo anterior.

### Troca por backend

`PracticeContentProvider` em `types/practice.ts` desacopla a preparação do banco. `localPracticeContentProvider` em `services/practice.ts` é o adapter atual. Um provider remoto deverá autenticar o proprietário, recuperar somente trechos autorizados, obter metadados reais e devolver questões estruturadas validadas, distinguindo material do aluno de complemento externo verificável. Questões médicas precisam de avaliação de qualidade. Nenhuma chave de provedor foi colocada no bundle.

Os contratos existentes de ingestão e recuperação permanecem disponíveis. Persistência remota, sincronização, provas específicas e proteção contra adulteração dependem do backend. O simulado local serve ao estudo, não à certificação segura.

## Arquivos

- `types/practice.ts`, `types/domain.ts`: contratos e campos opcionais compatíveis.
- `features/study/practice.ts`: fontes, histórico, domínio, seleção, relatório e validação.
- `services/practice.ts`, `services/index.ts`, `services/repository.ts`: operações, composição e migração.
- `mocks/practice.ts`, `mocks/seed.ts`, `constants/practice.ts`: fixtures e rótulos.
- `app/questions.tsx`, `app/practice/[id].tsx`, `components/practice/*`: preparação, configuração, sessão e análise.
- `app/mistakes.tsx`: agrupamento e nova prática por conceito.
- `app/compose.tsx`, `services/studio.ts`: autoria com dificuldade, subtópico e fonte.
- `mocks/navigation.ts`, `app/(tabs)/study.tsx`: descrições e entrada.
- `components/ui.tsx`: retorno entre etapas; `components/Motion.tsx`: bloquear resposta sem reduzir sua legibilidade.
- `app/(tabs)/library.tsx`: estabilidade da dependência de pastas no memo, apontada pelo lint.
- `tests/practice.test.ts`, `tests/e2e/practice.spec.ts` e regressões existentes migradas: regras, persistência, navegação e responsividade.

## Referências do desenho

As regras são uma aplicação de engenharia dos princípios, não uma reprodução dos protocolos ou validação direta deste app.

- [Larsen, Butler e Roediger, 2009](https://pubmed.ncbi.nlm.nih.gov/19930508/): ensaio randomizado com recuperação repetida e feedback na formação médica, com avaliação após meses.
- [Larsen, Butler e Roediger, 2013](https://pubmed.ncbi.nlm.nih.gov/23746156/): recuperação, autoexplicação e aplicação posterior com estudantes de Medicina.
- [Trumble et al., 2024](https://pubmed.ncbi.nlm.nih.gov/37615780/): revisão de prática distribuída e recuperação nas profissões da saúde; intervenções e instrumentos heterogêneos.
- [Khan, Davies e Gupta, 2001](https://pubmed.ncbi.nlm.nih.gov/11371292/): avaliação formativa e confiança informada pelo estudante para orientar feedback.
- [Cook et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23807104/): aprendizagem por domínio em simulação; os resultados não validam automaticamente um banco de múltipla escolha.
- [Revisão de educação radiológica, 2023](https://pubmed.ncbi.nlm.nih.gov/37683816/): recuperação, espaçamento e intercalação em um contexto médico específico.

A consistência básica dos exercícios fictícios de ácido-base foi confrontada com [Acid-base balance: part II](https://pubmed.ncbi.nlm.nih.gov/16573502/) e [Clinical acid-base pathophysiology](https://pubmed.ncbi.nlm.nih.gov/14687589/). Essas revisões não são apresentadas como arquivos do aluno ou citações fictícias de páginas.
