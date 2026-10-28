# 3. Backlog e prioridades

## 3.1 Critério de priorização

-   **P0 --- MVP:** necessário para demonstrar o fluxo completo de
    cronograma e capacidade com persistência.
-   **P1 --- Próxima versão:** melhora acompanhamento, governança e
    análise.
-   **P2 --- Futuro:** integrações e funcionalidades avançadas.

## 3.2 P0 --- MVP

### EP-01 --- Fundação

-   Criar repositório e estrutura do projeto.
-   Configurar ambientes e variáveis de ambiente.
-   Configurar banco de dados e migrações.
-   Implementar autenticação e autorização básica.
-   Definir logs e tratamento de erros.

### EP-02 --- Dados e API

-   Criar modelos de projeto, disciplina, tarefa, integrante e
    dependência.
-   Implementar CRUD de projetos.
-   Implementar CRUD de disciplinas.
-   Implementar CRUD de tarefas.
-   Implementar CRUD de integrantes.
-   Implementar criação e remoção de dependências.
-   Validar datas, progresso, esforço e ciclos de dependência.

### EP-03 --- Cronograma Gantt

-   Criar interface de projetos.
-   Integrar biblioteca Gantt.
-   Exibir tarefas agrupadas por disciplina.
-   Criar e editar tarefas.
-   Permitir mover e redimensionar tarefas.
-   Persistir mudanças pela API.
-   Tratar falhas com restauração do estado anterior ou atualização
    reconciliada.

### EP-04 --- Planejamento de capacidade

-   Configurar capacidade semanal por integrante.
-   Definir a regra de distribuição do esforço da tarefa no tempo.
-   Calcular horas alocadas por semana.
-   Calcular percentual de utilização.
-   Destacar sobrecarga acima de 100%.
-   Recalcular após alterações de datas, esforço, responsável ou
    capacidade.

### EP-05 --- Qualidade e entrega

-   Implementar testes de regras críticas.
-   Testar fluxo completo com dados de exemplo.
-   Configurar pipeline básico de integração contínua.
-   Documentar instalação e execução.
-   Publicar ambiente de homologação e, após validação, produção.

## 3.3 P1 --- Evolução

-   Painel de indicadores do projeto.
-   Histórico/auditoria de alterações.
-   Curva S planejada versus realizada.
-   Análise de gargalos por disciplina.
-   SPI com definição formal da metodologia e das entradas.
-   Calendários, feriados e jornadas de trabalho.
-   Relatórios básicos.

## 3.4 P2 --- Futuro

-   Importação e exportação avançadas.
-   Integrações com plataformas BIM e planejamento.
-   Vários responsáveis por tarefa.
-   Regras avançadas de dependências e calendários.
-   Funcionalidades financeiras ou de simulação 4D/5D.

## 3.5 Definition of Ready (DoR)

Uma tarefa está pronta para desenvolvimento quando: - O objetivo está
descrito. - Os requisitos e regras relacionados são conhecidos. - Os
critérios de aceite são verificáveis. - Dependências técnicas estão
identificadas. - Não há decisão de produto essencial escondida na
implementação.

## 3.6 Definition of Done (DoD)

Uma tarefa está concluída quando: - O comportamento atende aos critérios
de aceite. - Validações importantes são realizadas no backend. - Testes
pertinentes passam. - Erros e estados de carregamento são tratados na
interface, quando aplicável. - A documentação afetada é atualizada. - O
código foi revisado e integrado à branch principal conforme o processo
definido.
