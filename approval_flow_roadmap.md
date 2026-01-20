# Roadmap de Reestruturação do Fluxo de Aprovação

Este documento mapeia as fases necessárias para alinhar o sistema SIE com as novas regras de negócio coletadas.

## Fase 1: Ajuste de Status e Transições Iniciais (EM PROGRESSO)

- Redefinir a lógica de `submitProjectForApproval` para não exigir o preenchimento do instrumento.
- Permitir submissão apenas com Plano de Trabalho e Wizard de Classificação concluídos.
- Atualizar badges e feedbacks visuais no dashboard do proponente.

## Fase 2: Persistência de Dados Provisórios

- Alterar o `schema.prisma` para armazenar as respostas do Wizard e a sugestão de instrumento diretamente no modelo `Project`.
- Criar migração de banco de dados.
- Atualizar `createLegalInstrument` para salvar no `Project` em vez de criar a instância final.

## Fase 3: Interface Administrativa de Classificação

- Adicionar visualização das respostas do proponente na tela de revisão da SIE.
- Implementar componente para o Admin selecionar o Instrumento Jurídico final.
- Criar a Server Action `classifyProject` para oficializar o instrumento e gerar a instância de preenchimento.

## Fase 4: Fluxo de Edição Pós-Aprovação e PDF

- Liberar edição controlada após a definição do instrumento.
- Implementar a geração de PDF consolidado (Projeto + Plano + Cronograma + Instrumento).
- Ajustar lógica de "loop infinito" de correções se necessário.
