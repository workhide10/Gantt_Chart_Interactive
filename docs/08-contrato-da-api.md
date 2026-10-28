# 8. Contrato inicial da API

## 8.1 Convenções

-   Prefixo sugerido: `/api/v1`.
-   Formato de dados: JSON.
-   Datas de planejamento: usar um formato único documentado; para datas
    sem horário, preferir `YYYY-MM-DD`.
-   Identificadores: UUID ou outro padrão escolhido de forma
    consistente.
-   A API deve validar autorização em cada operação protegida.
-   Respostas de erro devem ter formato previsível e não expor detalhes
    internos.
-   Os endpoints abaixo são uma proposta inicial, não uma implementação
    existente.

## 8.2 Recursos sugeridos

  ------------------------------------------------------------------------------------
  Recurso                             Endpoints candidatos
  ----------------------------------- ------------------------------------------------
  Sessão/autenticação                 `POST /auth/login`, `POST /auth/refresh`,
                                      `POST /auth/logout`

  Usuário atual                       `GET /users/me`

  Projetos                            `GET /projects`, `POST /projects`,
                                      `GET /projects/{id}`, `PATCH /projects/{id}`,
                                      `DELETE /projects/{id}`

  Disciplinas/WBS                     `GET /projects/{id}/disciplines`,
                                      `POST /projects/{id}/disciplines`,
                                      `PATCH /disciplines/{id}`,
                                      `DELETE /disciplines/{id}`

  Tarefas                             `GET /projects/{id}/tasks`,
                                      `POST /disciplines/{id}/tasks`,
                                      `GET /tasks/{id}`, `PATCH /tasks/{id}`,
                                      `DELETE /tasks/{id}`

  Dependências                        `POST /tasks/{id}/dependencies`,
                                      `DELETE /dependencies/{id}`

  Integrantes                         `GET /members`, `POST /members`,
                                      `PATCH /members/{id}`, `DELETE /members/{id}`

  Capacidade                          `GET /capacity?project_id=...&from=...&to=...`
  ------------------------------------------------------------------------------------

A estratégia de autenticação, o escopo de cada endpoint e as operações
de arquivamento/exclusão devem ser confirmados antes da implementação.

## 8.3 Exemplo de atualização de tarefa

Requisição candidata:

``` http
PATCH /api/v1/tasks/{task_id}
Content-Type: application/json
```

``` json
{
  "start_date": "2026-11-02",
  "end_date": "2026-11-06",
  "progress": 25,
  "estimated_hours": 20
}
```

Resposta de sucesso: objeto atualizado com identificador, datas,
progresso, esforço e metadados acordados.

O backend deve validar as datas, a existência dos relacionamentos, o
escopo de acesso e as regras de dependência antes de persistir.

## 8.4 Formato de erro sugerido

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A data final não pode ser anterior à data inicial.",
    "details": [
      {
        "field": "end_date",
        "reason": "must_be_on_or_after_start_date"
      }
    ]
  }
}
```

Não retornar stack traces, segredos ou detalhes internos ao cliente.

## 8.5 Atualização e concorrência

Para o MVP, definir uma política de conflito de edição. Uma opção é
incluir `updated_at` ou um número de versão e rejeitar atualizações
baseadas em dados desatualizados. Se a política não for implementada no
MVP, documentar a limitação e evitar sobrescritas silenciosas.

## 8.6 Capacidade

A resposta de capacidade deve tornar explícitos: - Integrante. - Período
semanal. - Horas disponíveis. - Horas alocadas. - Percentual de
utilização, quando calculável. - Indicador de sobrecarga. - Regra de
distribuição de esforço aplicada, se relevante.

## 8.7 Documentação automática

FastAPI pode disponibilizar documentação OpenAPI. A documentação gerada
deve refletir os contratos implementados e não substituir testes de
integração.
