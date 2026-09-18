# NORTHE Delivery

Base oficial de portais, galerias e experiências de entrega da NORTHE.

Domínio canônico: `https://entregas.madebynorthe.com.br`

## Produtos de entrega aprovados

A NORTHE mantém três experiências oficiais dentro desta mesma base:

- **Delivery Standard** para entrega direta de peças prontas;
- **Delivery Extended — Principal** para projetos que pedem dashboard e estrutura ampliada;
- **Entrega de Roteiros** para revisão e aprovação antes da produção.

### 1. Delivery Standard

Base padrão aprovada para entrega aos clientes.

Rota de referência:

`https://entregas.madebynorthe.com.br/standard/lavareda/`

Usar esta experiência como ponto de partida quando a entrega precisar ser direta, refinada e focada no cliente.

A lógica de aprovação poderá evoluir, mas a estrutura visual e de experiência em `standard/` é a base aprovada.

### 2. Delivery Extended — Principal

Experiência maior para projetos que precisam de mais estrutura, dashboard e recursos adicionais.

Rota de referência:

`https://entregas.madebynorthe.com.br/lavareda/`

Usar quando o projeto justificar uma camada operacional/gerencial maior do que a entrega padrão.

### 3. Entrega de Roteiros

Experiência específica para apresentar roteiros antes da produção.

Primeira implementação oficial:

`https://entregas.madebynorthe.com.br/roteiros/pet-patty/outubro-2026/`

A interface usa abertura inline: ao selecionar um roteiro ele expande no próprio lugar, os demais ficam recolhidos e o cliente aprova ou solicita ajuste dentro da mesma seção. A base é compartilhada entre clientes e ciclos.

## Regra de produto

Antes de criar uma nova experiência de entrega, escolher uma das duas bases:

- entrega padrão → `standard/`;
- entrega ampliada/dashboard → Principal.

Não criar novas versões numeradas ou novos repositórios apenas para atender um cliente. Evoluções aprovadas devem partir de uma dessas duas bases.

## Estrutura compartilhada

A base mantém configuração, assets e rotas de clientes dentro do mesmo repositório. Cada cliente deve receber apenas os dados, identidade e recursos específicos necessários, reaproveitando a estrutura aprovada.

## Publicação

A Vercel é o host técnico de produção.

O cliente deve receber apenas endereços em `entregas.madebynorthe.com.br`.

O GitHub continua sendo a origem do código e poderá ser tornado privado depois que o domínio customizado estiver validado na Vercel.

## Status

As versões numeradas deixaram de ser bases de produto. A entrega padrão aprovada vive em `standard/`; a antiga rota V7.1 existe apenas como redirecionamento de compatibilidade. O Match Day do Estrela do Norte também foi removido.

NORTHE — MADE IN THE NORTH.
