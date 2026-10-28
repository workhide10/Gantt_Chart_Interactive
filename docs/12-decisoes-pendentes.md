# 12. Decisões pendentes e hipóteses

Este documento separa decisões confirmadas de hipóteses de trabalho. As
opções listadas como proposta não devem ser tratadas como decisões
tomadas pelo usuário ou pela equipe até serem aprovadas.

## 12.1 Decisões de produto

  -----------------------------------------------------------------------
  ID                Questão           Proposta inicial  Estado
  ----------------- ----------------- ----------------- -----------------
  D-01              Organização dos   Um workspace pode Pendente de
                    projetos          conter vários     confirmação
                                      projetos          

  D-02              Responsáveis por  Um responsável    Pendente de
                    tarefa            principal         confirmação

  D-03              Distribuição de   Distribuição      Pendente de
                    esforço           uniforme entre    validação
                                      dias úteis no     
                                      intervalo         

  D-04              Violação de       Alertar e         Pendente de
                    dependência       solicitar         confirmação
                                      confirmação, sem  
                                      mover tarefas     
                                      silenciosamente   

  D-05              Escopo inicial    Gantt +           Proposta de MVP
                                      planejamento de   
                                      capacidade, com   
                                      persistência,     
                                      permissões e CRUD 
                                      necessários       
  -----------------------------------------------------------------------

## 12.2 Decisões de modelo de dados

-   Um usuário pode participar de vários workspaces?
-   O workspace representa uma empresa, equipe ou ambiente de trabalho?
-   Uma tarefa pode ficar sem responsável?
-   A capacidade pode variar por semana?
-   A WBS será hierárquica em vários níveis?
-   Quais tipos de dependência serão implementados?
-   O histórico de alteração será obrigatório no MVP?
-   Exclusões serão físicas, lógicas (arquivamento) ou ambas?

## 12.3 Decisões de calendário e capacidade

-   Quais dias são considerados úteis?
-   Feriados serão considerados no MVP?
-   A data final de uma tarefa é inclusiva?
-   Como tarefas parciais ou com horas irregulares são distribuídas?
-   O esforço estimado representa horas totais de trabalho ou horas por
    pessoa?
-   Como lidar com tarefa sem responsável?
-   Como calcular capacidade em semanas incompletas no início ou fim do
    projeto?
-   O que acontece quando a capacidade de uma pessoa muda
    retroativamente?

## 12.4 Decisões técnicas

-   DHTMLX Gantt ou Frappe Gantt? Verificar funcionalidades necessárias
    e licenciamento.
-   Autenticação própria ou provedor externo?
-   Monorepositório ou repositórios separados?
-   Como será feito o controle de concorrência em edições simultâneas?
-   Onde hospedar frontend, API e PostgreSQL?
-   Quais limites de desempenho e disponibilidade são necessários?
-   Quais políticas de backup, retenção e restauração serão adotadas?

## 12.5 Registro de decisão

Para cada decisão, registrar: - **ID:** identificador. - **Questão:** o
que precisa ser decidido. - **Opções consideradas:** alternativas
reais. - **Decisão:** opção escolhida. - **Justificativa:** motivo e
trade-offs. - **Impactos:** requisitos, dados, API, interface, testes e
prazo afetados. - **Responsável e data:** quem aprovou e quando.

## 12.6 Regra de governança

Não implementar uma decisão de alto impacto apenas porque uma opção
aparece como "proposta inicial". Quando a escolha afeta o banco de
dados, as permissões ou o algoritmo de capacidade, resolver e documentar
a decisão antes de consolidar a implementação.
