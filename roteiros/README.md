# NORTHE — Entrega de Roteiros

Base reutilizável para apresentação e aprovação de roteiros antes da produção.

## Produto

Nome de interface: **Entrega de Roteiros**  
Função: revisão e aprovação de roteiro por cliente.

A primeira implementação oficial é:

`/roteiros/pet-patty/outubro-2026/`

## Regra de UX

- o roteiro abre no próprio card;
- apenas um roteiro fica expandido por vez;
- clicar no número ou no card abre e leva o conteúdo para a área visível;
- clicar no mesmo roteiro novamente recolhe;
- funciona da mesma forma em desktop e mobile;
- a decisão acontece dentro do roteiro;
- o final de cada roteiro oferece o próximo;
- o progresso fica visível sem virar dashboard;
- aprovação e pedidos de ajuste ficam salvos localmente no navegador;
- ao final, o cliente pode copiar ou compartilhar o resumo da revisão.

## Estrutura

`/roteiros/app.js` — comportamento compartilhado  
`/roteiros/style.css` — interface compartilhada  
`/roteiros/<cliente>/<ciclo>/index.html` — entrada da entrega  
`/roteiros/<cliente>/<ciclo>/data.js` — conteúdo específico

Novo cliente/ciclo não deve gerar um novo sistema ou repositório.  
A base é compartilhada; muda apenas a configuração/conteúdo da entrega.

## NORTHE

MADE IN THE NORTH.
