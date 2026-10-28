# 2. Requisitos do sistema

## 2.1 Convenções

Prioridades: **P0** = indispensável ao MVP; **P1** = evolução próxima;
**P2** = futura. Os requisitos devem ser revisados com usuários antes de
serem considerados definitivos.

## 2.2 Requisitos funcionais

  -----------------------------------------------------------------------
  ID                      Requisito               Prioridade
  ----------------------- ----------------------- -----------------------
  RF-001                  O sistema deve permitir P0
                          autenticação de         
                          usuários.               

  RF-002                  O sistema deve aplicar  P0
                          autorização por papel e 
                          escopo de acesso.       

  RF-003                  O usuário autorizado    P0
                          deve criar, visualizar, 
                          editar e arquivar       
                          projetos.               

  RF-004                  O sistema deve permitir P0
                          organizar um projeto    
                          por disciplinas ou      
                          agrupadores WBS.        

  RF-005                  O sistema deve permitir P0
                          criar, visualizar,      
                          editar e excluir ou     
                          arquivar tarefas        
                          conforme regras de      
                          integridade.            

  RF-006                  Cada tarefa deve ter    P0
                          nome, datas, progresso  
                          e esforço estimado.     

  RF-007                  O sistema deve          P0
                          apresentar as tarefas   
                          em um gráfico de Gantt. 

  RF-008                  O usuário autorizado    P0
                          deve poder alterar      
                          datas de tarefas pela   
                          interface do Gantt.     

  RF-009                  O sistema deve salvar   P0
                          alterações de           
                          cronograma no backend.  

  RF-010                  O sistema deve permitir P0
                          cadastrar dependências  
                          entre tarefas.          

  RF-011                  O sistema deve permitir P0
                          cadastrar integrantes e 
                          sua capacidade semanal  
                          em horas.               

  RF-012                  O sistema deve calcular P0
                          a carga semanal alocada 
                          por integrante.         

  RF-013                  O sistema deve          P0
                          sinalizar semanas cuja  
                          utilização ultrapasse   
                          100% da capacidade      
                          configurada.            

  RF-014                  O sistema deve informar P0
                          erros de validação sem  
                          perder silenciosamente  
                          o estado anterior.      

  RF-015                  O sistema deve          P0
                          preservar os dados após 
                          recarregar a aplicação  
                          e reiniciar os          
                          serviços, conforme a    
                          persistência            
                          configurada.            

  RF-016                  O sistema deve oferecer P1
                          uma visão resumida de   
                          cronograma e            
                          capacidade.             

  RF-017                  O sistema deve          P1
                          registrar eventos       
                          relevantes de alteração 
                          para auditoria.         

  RF-018                  O sistema deve          P1
                          apresentar curva S      
                          planejada versus        
                          realizada.              

  RF-019                  O sistema deve destacar P1
                          gargalos por            
                          disciplina.             

  RF-020                  O sistema deve calcular P1
                          SPI quando houver dados 
                          e método de cálculo     
                          definidos.              

  RF-021                  O sistema poderá        P2
                          exportar dados para     
                          formatos acordados,     
                          como CSV ou XLSX.       

  RF-022                  O sistema poderá        P2
                          integrar-se a           
                          ferramentas externas de 
                          planejamento ou BIM.    
  -----------------------------------------------------------------------

## 2.3 Requisitos não funcionais

  -----------------------------------------------------------------------
  ID                      Requisito               Prioridade
  ----------------------- ----------------------- -----------------------
  RNF-001                 A API deve validar      P0
                          dados de entrada no     
                          servidor.               

  RNF-002                 A aplicação deve usar   P0
                          HTTPS em ambientes      
                          publicados.             

  RNF-003                 Senhas, segredos e      P0
                          tokens não devem ser    
                          armazenados em          
                          código-fonte.           

  RNF-004                 Consultas e alterações  P0
                          devem respeitar o       
                          escopo de acesso do     
                          usuário.                

  RNF-005                 Operações que alterem   P0
                          várias entidades        
                          relacionadas devem usar 
                          transações quando       
                          necessário.             

  RNF-006                 A interface deve        P0
                          informar carregamento,  
                          sucesso e falha nas     
                          operações relevantes.   

  RNF-007                 O projeto deve possuir  P0
                          testes automatizados    
                          para regras críticas.   

  RNF-008                 O código deve ser       P0
                          versionado em Git e     
                          alterações importantes  
                          devem passar por        
                          revisão.                

  RNF-009                 O ambiente de           P1
                          desenvolvimento deve    
                          ser reproduzível por    
                          instruções documentadas 
                          e/ou Docker.            

  RNF-010                 O sistema deve ter logs P1
                          operacionais            
                          suficientes para        
                          diagnosticar falhas sem 
                          expor segredos.         
  -----------------------------------------------------------------------

## 2.4 Requisitos de interface

-   A tela de cronograma deve apresentar tarefas hierarquizadas por
    projeto e disciplina.
-   A linha do tempo deve oferecer, no mínimo, visualização por semana e
    mês; a escala diária pode ser incluída conforme a biblioteca
    escolhida.
-   A edição de datas deve apresentar feedback visual enquanto salva.
-   A visão de capacidade deve permitir identificar integrante, período,
    horas disponíveis, horas alocadas e percentual de utilização.
-   As cores e os ícones de sobrecarga não devem ser o único meio de
    comunicar o estado; apresentar também texto ou valores.

## 2.5 Requisitos de integridade

-   Datas inválidas devem ser rejeitadas pelo backend.
-   Progresso deve estar entre 0 e 100.
-   Esforço estimado não pode ser negativo.
-   Dependências não podem formar ciclos.
-   O cálculo de capacidade deve usar uma regra de distribuição de horas
    documentada.
-   A mesma regra de negócio deve produzir resultados coerentes na
    interface e na API.

## 2.6 Rastreabilidade

Cada requisito implementado deve ser associado a uma ou mais regras de
negócio, tarefas do backlog, critérios de aceite e casos de teste.
Consulte `04-regras-de-negocio-e-aceite.md`, `09-plano-de-execucao.md` e
`10-plano-de-testes.md`.
