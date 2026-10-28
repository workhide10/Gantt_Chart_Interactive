# 11. Implantação e operação

## 11.1 Ambientes

Recomenda-se separar: - **Desenvolvimento:** uso local dos
desenvolvedores, com dados fictícios. - **Homologação:** validação
funcional antes de publicar. - **Produção:** dados reais e acesso
controlado.

Não reutilizar credenciais ou bancos de produção em desenvolvimento.

## 11.2 Configuração

-   Manter `.env.example` com nomes de variáveis e valores ilustrativos,
    sem segredos.
-   Injetar segredos por variáveis protegidas ou gerenciador de segredos
    do provedor.
-   Separar URLs, chaves e configurações por ambiente.
-   Não versionar arquivos `.env` reais.

## 11.3 Pipeline de CI/CD sugerido

1.  Instalar dependências com versões controladas.
2.  Executar lint e verificações estáticas.
3.  Executar testes unitários.
4.  Executar testes de integração quando houver ambiente adequado.
5.  Construir os artefatos.
6.  Publicar homologação após aprovação ou regra de branch definida.
7.  Executar migrações de produção de forma controlada.
8.  Publicar e executar verificações básicas de saúde.

A sequência exata depende do provedor e das ferramentas selecionadas.

## 11.4 Banco de dados e migrações

-   Versionar migrações.
-   Revisar alterações destrutivas antes de aplicá-las.
-   Fazer backup antes de migrações de risco.
-   Testar restauração de backup periodicamente.
-   Definir retenção de backups conforme necessidades do produto e
    obrigações aplicáveis.

## 11.5 Segurança mínima

-   HTTPS em ambientes públicos.
-   Autenticação segura e expiração/renovação de sessão definida.
-   Autorização validada no servidor em todas as operações.
-   Senhas armazenadas com algoritmo apropriado de hash, caso
    autenticação própria seja escolhida.
-   Limites e proteção contra abuso nos endpoints expostos.
-   Logs sem senhas, tokens ou segredos.
-   Atualização regular de dependências.
-   Revisão de exposição de dados entre workspaces/organizações.
-   Política de backup, restauração e resposta a incidentes.

## 11.6 Observabilidade

Registrar, sem dados sensíveis desnecessários: - Erros de API. - Falhas
de banco e de migração. - Falhas em operações de cronograma. - Tempo de
resposta de endpoints críticos. - Falhas de autenticação relevantes e
tentativas de acesso negadas. - Estado dos serviços.

## 11.7 Checklist pré-produção

-   [ ] Escopo do MVP e decisões críticas aprovados.
-   [ ] Testes P0 executados.
-   [ ] HTTPS habilitado.
-   [ ] Segredos configurados fora do repositório.
-   [ ] Permissões e isolamento de dados testados.
-   [ ] Backup e restauração verificados.
-   [ ] Migrações revisadas.
-   [ ] Logs e monitoramento configurados.
-   [ ] Termos de uso e política de privacidade avaliados conforme o
    produto e jurisdição.
-   [ ] Responsável por incidentes e recuperação definido.
-   [ ] Homologação aprovada.
