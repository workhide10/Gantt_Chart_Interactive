# 5. Fluxos de usuário

## 5.1 Papéis iniciais propostos

**Gestor:** administra projetos sob seu escopo, disciplinas, tarefas,
integrantes, capacidade e dependências.

**Modelador/integrante:** consulta os projetos aos quais tem acesso e,
se autorizado, atualiza o progresso ou campos específicos de suas
tarefas.

Os papéis são uma proposta inicial. A matriz definitiva de permissões
deve ser aprovada antes da publicação.

## 5.2 Fluxo --- criar projeto

1.  O usuário autentica-se.
2.  A aplicação apresenta os projetos acessíveis.
3.  O usuário seleciona "Novo projeto".
4.  Informa nome, datas e demais campos obrigatórios definidos no
    formulário.
5.  A interface valida os campos básicos.
6.  A API verifica autorização e regras de negócio.
7.  O backend persiste o projeto.
8.  A interface apresenta confirmação e abre a página do projeto.

**Alternativas:** se a API rejeitar os dados, a interface apresenta o
motivo e preserva os campos preenchidos.

## 5.3 Fluxo --- estruturar disciplinas e tarefas

1.  O usuário abre um projeto.
2.  Cria ou edita as disciplinas/agrupadores WBS.
3.  Cria tarefas em cada agrupador.
4.  Informa datas, esforço estimado, progresso e responsável principal,
    caso essa decisão seja confirmada.
5.  O backend valida as relações e os campos.
6.  As tarefas aparecem na estrutura do Gantt.

## 5.4 Fluxo --- alterar o cronograma

1.  O usuário localiza a tarefa no Gantt.
2.  Arrasta a barra para alterar o intervalo ou redimensiona uma
    extremidade para alterar a duração.
3.  A interface atualiza a visualização de forma otimista, se esse
    padrão for adotado.
4.  A aplicação envia a alteração à API.
5.  O backend valida datas, autorização e dependências.
6.  O banco grava a alteração em transação quando necessário.
7.  A API retorna os dados atualizados.
8.  A interface reconcilia o estado local com a resposta.
9.  A capacidade semanal afetada é atualizada.
10. Se ocorrer erro, a interface informa a falha e restaura ou recarrega
    os dados persistidos.

## 5.5 Fluxo --- configurar capacidade

1.  O gestor abre a área de equipe.
2.  Seleciona um integrante.
3.  Define sua capacidade semanal em horas.
4.  A API valida e persiste o valor.
5.  A aplicação recalcula as semanas afetadas.
6.  A interface exibe horas disponíveis, horas alocadas e utilização
    percentual.

## 5.6 Fluxo --- identificar e resolver sobrecarga

1.  O gestor abre o planejamento de capacidade.
2.  A interface apresenta a carga semanal por integrante.
3.  Semanas acima de 100% são sinalizadas.
4.  O gestor identifica as tarefas que contribuem para a sobrecarga.
5.  Ajusta datas, esforço, responsável ou capacidade, respeitando as
    regras do projeto.
6.  O sistema recalcula as semanas afetadas e apresenta o resultado
    atualizado.

## 5.7 Fluxo --- criar dependência

1.  O usuário seleciona uma tarefa predecessora e uma sucessora.
2.  Escolhe o tipo de dependência disponível.
3.  A API verifica se as tarefas pertencem ao escopo autorizado.
4.  O backend verifica se a dependência formaria um ciclo.
5.  Se válida, a dependência é persistida.
6.  O Gantt exibe a ligação entre as tarefas.

## 5.8 Fluxos de erro essenciais

-   Sessão expirada: solicitar autenticação novamente sem descartar
    dados não enviados quando for seguro preservá-los.
-   Falha de rede: indicar que o salvamento não foi confirmado.
-   Conflito de atualização: recarregar ou oferecer resolução explícita,
    em vez de sobrescrever silenciosamente.
-   Permissão insuficiente: negar a operação e não revelar dados de
    outros escopos.
-   Dados inválidos: associar a mensagem ao campo ou ação
    correspondente.
