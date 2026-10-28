# 10. Plano de testes e aceite do MVP

## 10.1 Objetivo

Verificar que o fluxo principal --- estruturar projeto, planejar tarefas
no Gantt e acompanhar capacidade --- funciona com dados persistidos,
regras coerentes e permissões aplicadas.

## 10.2 Dados de demonstração

Projeto fictício: **Edifício Horizonte --- Coordenação BIM**.

Disciplinas sugeridas: - Arquitetura. - Estrutura. - Elétrica. -
Telecomunicações. - Hidrossanitário.

Integrantes de exemplo: - Modelador A: 40 h/semana. - Modelador B: 32
h/semana. - Coordenador: capacidade configurada conforme cenário.

Tarefas e nomes são apenas dados fictícios de teste. Ajustar datas e
esforço de acordo com a regra de distribuição aprovada.

## 10.3 Casos de teste

  -----------------------------------------------------------------------
  ID                      Cenário                 Resultado esperado
  ----------------------- ----------------------- -----------------------
  CT-001                  Criar, consultar e      Dados persistidos e
                          editar projeto          retornados corretamente

  CT-002                  Criar tarefa com data   API rejeita com erro de
                          final anterior à        validação
                          inicial                 

  CT-003                  Informar progresso      API rejeita a alteração
                          abaixo de 0 ou acima de 
                          100                     

  CT-004                  Mover tarefa no Gantt e Nova data permanece
                          recarregar a página     persistida

  CT-005                  Criar dependência que   API rejeita a
                          forme um ciclo          dependência

  CT-006                  Integrante com 40 h     Utilização de 80%
                          disponíveis e 32 h      
                          alocadas                

  CT-007                  Integrante com 40 h     Utilização de 115% e
                          disponíveis e 46 h      sinalização de
                          alocadas                sobrecarga

  CT-008                  Usuário sem permissão   Operação negada
                          tenta editar projeto    

  CT-009                  API falha durante       Interface informa falha
                          alteração otimista do   e restaura/reconcilia
                          Gantt                   estado

  CT-010                  Reiniciar serviços e    Dados continuam
                          consultar dados         disponíveis após
                                                  reinício, conforme
                                                  configuração

  CT-011                  Capacidade disponível   Sem divisão por zero;
                          igual a zero            estado não calculável
                                                  ou equivalente definido

  CT-012                  Alterar esforço, datas, Semanas afetadas são
                          responsável ou          recalculadas
                          capacidade              

  CT-013                  Criar tarefa sem        Resultado segue a regra
                          responsável, se         aprovada e documentada
                          permitido               

  CT-014                  Dois usuários editam a  Conflito tratado
                          mesma tarefa            conforme política
                                                  definida, sem
                                                  sobrescrita silenciosa
                                                  se houver controle de
                                                  versão
  -----------------------------------------------------------------------

## 10.4 Testes por camada

### Unitários

-   Validação de datas.
-   Validação de progresso e esforço.
-   Cálculo de utilização.
-   Distribuição de horas por período.
-   Detecção de ciclos em dependências.

### Integração

-   Rotas com banco de dados.
-   Restrições e chaves estrangeiras.
-   Autorização e escopo de acesso.
-   Atualização de tarefa e recálculo de capacidade.

### Interface / end-to-end

-   Login.
-   Criar projeto e disciplinas.
-   Criar tarefas.
-   Alterar tarefa no Gantt.
-   Visualizar capacidade e sobrecarga.
-   Confirmar persistência após recarregar.

## 10.5 Roteiro de demonstração

1.  Autenticar como gestor.
2.  Criar o projeto fictício.
3.  Criar disciplinas e integrantes.
4.  Cadastrar tarefas com datas, esforço e responsável conforme regras
    aprovadas.
5.  Exibir tarefas no Gantt e criar uma dependência.
6.  Alterar a data de uma tarefa e verificar persistência.
7.  Abrir a visão semanal de capacidade e demonstrar uma carga normal.
8.  Ajustar dados para produzir uma sobrecarga conhecida e verificar a
    sinalização.
9.  Recarregar a aplicação e confirmar consistência.

## 10.6 Critérios de aceite do MVP

O MVP poderá ser considerado pronto para homologação quando: - Todos os
casos P0 aplicáveis passarem. - Não houver falha bloqueadora no fluxo
principal. - As alterações do Gantt forem persistidas. - O cálculo de
capacidade estiver documentado e testado. - A autorização for validada
por testes. - As instruções de execução e implantação estiverem
atualizadas. - O responsável pelo produto aprovar os resultados da
demonstração.
