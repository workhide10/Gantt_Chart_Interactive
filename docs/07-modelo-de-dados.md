# 7. Modelo conceitual de dados

## 7.1 Entidades iniciais

### Project

Representa um projeto de planejamento.

Campos candidatos: - `id`: identificador. - `name`: nome. - `status`:
estado do projeto. - `start_date`: início planejado. - `end_date`:
término planejado. - `created_at` e `updated_at`: auditoria técnica.

### Discipline / WBS

Representa uma disciplina ou agrupador de trabalho dentro do projeto.

Campos candidatos: - `id`. - `project_id`: referência ao projeto. -
`name`. - `color`: cor de apresentação, opcional. - `sort_order`:
ordenação visual, opcional.

### Task

Representa uma tarefa planejável.

Campos candidatos: - `id`. - `discipline_id`: agrupador ao qual
pertence. - `assigned_to`: integrante responsável, se houver. -
`name`. - `start_date`. - `end_date`. - `progress`: percentual de
conclusão. - `estimated_hours`: esforço estimado. - `created_at` e
`updated_at`.

### Member

Representa um integrante da equipe.

Campos candidatos: - `id`. - `name`. - `role`. -
`weekly_capacity_hours`: capacidade semanal padrão. - `created_at` e
`updated_at`.

### Dependency

Representa uma relação de precedência entre tarefas.

Campos candidatos: - `id`. - `source_task_id`: tarefa predecessora. -
`target_task_id`: tarefa sucessora. - `type`: tipo de dependência,
inicialmente Finish-to-Start.

### User

Representa uma conta de acesso.

Campos candidatos: - `id`. - `email`. - `password_hash` ou referência ao
provedor de identidade. - `role` ou associações de permissões. -
`created_at` e `updated_at`.

## 7.2 Relacionamentos conceituais

``` text
Project 1 ─── N Discipline/WBS
Discipline/WBS 1 ─── N Task
Member 1 ─── N Task (responsável principal, se confirmado)
Task N ─── N Task (por meio de Dependency)
User ─── permissões e escopos de acesso
```

A estrutura multi-tenant pode exigir uma entidade `Workspace` ou
`Organization`, associações de usuários ao workspace e escopo de acesso
em todos os registros relevantes.

## 7.3 Restrições recomendadas

-   Chaves primárias em todas as entidades.
-   Chaves estrangeiras para relacionamentos.
-   `end_date >= start_date`.
-   `0 <= progress <= 100`.
-   `estimated_hours >= 0`.
-   Impedir uma dependência de uma tarefa para ela própria.
-   Impedir ciclos no grafo de dependências.
-   Definir política explícita para exclusão de projeto, disciplina,
    tarefa e integrante.
-   Criar índices para chaves estrangeiras e consultas recorrentes.
-   Armazenar timestamps de auditoria de forma consistente.

## 7.4 Questões de modelagem pendentes

1.  Um usuário poderá pertencer a vários workspaces?
2.  Um workspace poderá conter vários projetos? (proposta inicial: sim)
3.  Uma tarefa terá um responsável principal ou vários responsáveis?
4.  A capacidade será fixa por integrante ou poderá variar por semana?
5.  O sistema manterá histórico de alterações?
6.  Tarefas poderão ficar sem responsável?
7.  A hierarquia WBS terá apenas um nível ou será recursiva?
8.  Quais tipos de dependência serão suportados além de Finish-to-Start?
9.  Como serão tratados feriados, jornadas parciais e calendários
    diferentes?
10. Será permitido esforço estimado igual a zero?
11. O que ocorre com tarefas ao arquivar ou excluir uma disciplina?

## 7.5 Observação

Este é um modelo conceitual inicial, não um esquema SQL definitivo.
Antes de criar migrações, confirmar as decisões pendentes e desenhar o
modelo lógico com nulabilidade, unicidade, índices, exclusões e escopo
multi-tenant.
