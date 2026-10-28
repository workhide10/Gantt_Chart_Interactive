# 4. Regras de negócio e critérios de aceitação

## 4.1 Regras de negócio

  -----------------------------------------------------------------------
  ID                                  Regra
  ----------------------------------- -----------------------------------
  RN-001                              Um projeto pode conter várias
                                      disciplinas ou agrupadores WBS.

  RN-002                              Uma tarefa pertence a um agrupador
                                      do projeto, conforme o modelo
                                      inicial.

  RN-003                              A data final de uma tarefa não pode
                                      anteceder sua data inicial.

  RN-004                              O progresso deve estar entre 0% e
                                      100%.

  RN-005                              O esforço estimado deve ser maior
                                      ou igual a zero.

  RN-006                              Cada integrante possui uma
                                      capacidade semanal configurada em
                                      horas; regras futuras poderão
                                      permitir capacidade por período.

  RN-007                              Utilização semanal (%) = horas
                                      alocadas na semana / horas
                                      disponíveis na semana × 100.

  RN-008                              Uma utilização superior a 100%
                                      caracteriza sobrecarga.

  RN-009                              O grafo de dependências não pode
                                      conter ciclos.

  RN-010                              A alteração de uma tarefa que viole
                                      uma dependência deve seguir a
                                      política configurada: rejeitar,
                                      alertar ou solicitar confirmação. A
                                      política inicial ainda precisa ser
                                      confirmada.

  RN-011                              Toda leitura e alteração deve
                                      verificar autorização e escopo do
                                      recurso no backend.

  RN-012                              O método de distribuição de esforço
                                      entre dias/semanas deve ser
                                      documentado e aplicado de forma
                                      consistente.

  RN-013                              Uma capacidade disponível igual a
                                      zero não deve gerar divisão por
                                      zero; a utilização deve ser
                                      apresentada como não calculável ou
                                      como estado específico definido
                                      pela interface.

  RN-014                              Mudanças de datas, esforço,
                                      responsável ou capacidade devem
                                      provocar recálculo da carga
                                      afetada.

  RN-015                              A exclusão de entidades
                                      referenciadas deve respeitar
                                      integridade referencial e política
                                      de exclusão/arquivamento.
  -----------------------------------------------------------------------

## 4.2 Fórmula de capacidade

Para uma pessoa (p) e uma semana (w):

\[ `\text{Utilização}`{=tex}\_{p,w} =
`\frac{\text{Horas alocadas}_{p,w}}{\text{Horas disponíveis}_{p,w}}`{=tex}
`\times 100`{=tex} \]

A fórmula é direta, mas o resultado depende de como as horas estimadas
de cada tarefa são distribuídas pelo calendário. Essa distribuição é uma
decisão de produto, não uma consequência automática da fórmula.

### Exemplos de aceite

-   32 horas alocadas / 40 horas disponíveis = 80%.
-   46 horas alocadas / 40 horas disponíveis = 115%, portanto há
    sobrecarga.
-   0 horas disponíveis: não calcular percentual por divisão; exibir
    estado definido para capacidade zero.
-   Alterar datas, esforço, responsável ou capacidade deve atualizar as
    semanas afetadas.
-   A API e a interface devem apresentar valores consistentes.

## 4.3 Critérios de aceitação por comportamento

### CA-001 --- Datas válidas

Dado que uma tarefa está sendo criada ou editada, quando a data final
for anterior à inicial, então a API deve rejeitar a alteração e explicar
o erro.

### CA-002 --- Progresso válido

Dado um progresso informado, quando o valor for menor que 0 ou maior que
100, então a API deve rejeitar a alteração.

### CA-003 --- Persistência do Gantt

Dada uma tarefa existente, quando o usuário mover ou redimensionar a
barra e a API confirmar o salvamento, então a nova data deve permanecer
após recarregar a página.

### CA-004 --- Falha ao salvar

Dada uma alteração otimista no Gantt, quando a API falhar, então a
interface deve informar a falha e restaurar ou reconciliar o estado com
os dados persistidos.

### CA-005 --- Dependência sem ciclo

Dado um conjunto de tarefas, quando uma dependência criar um ciclo,
então a API deve rejeitá-la.

### CA-006 --- Capacidade dentro do limite

Dado um integrante com 40 h disponíveis e 32 h alocadas em uma semana,
então a utilização deve ser 80% e não deve ser marcada como sobrecarga.

### CA-007 --- Sobrecarga

Dado um integrante com 40 h disponíveis e 46 h alocadas em uma semana,
então a utilização deve ser 115% e a interface deve sinalizar
sobrecarga.

### CA-008 --- Capacidade zero

Dado um integrante sem horas disponíveis na semana, então o sistema não
deve produzir erro aritmético nem mostrar um percentual enganoso.

### CA-009 --- Permissões

Dado um usuário sem permissão para editar um projeto, quando tentar
alterar uma tarefa desse projeto, então a API deve negar a operação.

### CA-010 --- Consistência

Dada uma mudança que afete a capacidade, quando o backend concluir o
recálculo, então os valores exibidos devem corresponder aos valores
retornados ou consultados pela API.

## 4.4 Política de dependências

A primeira versão pode implementar dependência Finish-to-Start (FS): a
tarefa sucessora começa após a conclusão da predecessora, conforme
calendário e regras que ainda serão definidos. É necessário decidir se
violações serão rejeitadas automaticamente, exibidas como alerta ou
submetidas à confirmação do usuário. Não implementar propagação
automática de datas sem especificar essa política.

## 4.5 Distribuição de esforço --- decisão pendente

Uma hipótese simples para o MVP é distribuir o esforço uniformemente
entre os dias úteis contidos no intervalo da tarefa. Antes de
implementar, definir: - Se as datas inicial e final contam como dias de
trabalho. - Como tratar fins de semana e feriados. - Como tratar tarefas
de duração de um dia. - Como distribuir horas quando a tarefa não possui
responsável. - Como tratar capacidade parcial e tarefas que cruzam
semanas. - Se o esforço total é mantido mesmo quando o intervalo muda.

A hipótese uniforme deve ser validada com usuários de planejamento BIM.
