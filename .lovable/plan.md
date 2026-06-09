# Feed XML por corretor — VRSync + Imovelweb

Cada corretor terá **2 URLs públicas e fixas** que pode colar no painel do portal. O portal busca o XML em intervalos próprios (de hora em hora ou diário) e atualiza os anúncios automaticamente.

```text
https://<dominio>/feed/<slug>/vrsync.xml      → ZAP + Viva Real + OLX
https://<dominio>/feed/<slug>/imovelweb.xml   → Imovelweb / ImóvelGuide
```

O `<slug>` é o mesmo já usado no site do corretor (a partir do `full_name` em `profiles`), portanto não exige nada novo do usuário.

## O que vai aparecer pro corretor

Nova aba **"Feeds XML / Portais"** dentro de Configurações:

- Os 2 links acima, com botão "Copiar".
- Toggle global "Publicar imóveis nos portais" (default ligado para quem tem plano ativo).
- Instruções curtas por portal (onde colar a URL): ZAP, Viva Real, OLX, Imovelweb.
- Indicador "X imóveis no feed" + última geração.
- Por imóvel: switch novo `publicar_xml` no cadastro (default = mesmo valor de `ativo_site`), para o corretor poder esconder de portal sem tirar do site próprio.

## Quais imóveis entram no feed

- `ativo_site = true`
- `status ≠ Vendido`
- `publicar_xml = true` (novo campo, default true)
- Dono com assinatura ativa (`imovel_owner_has_active_sub`) — mesma regra já usada nas RLS públicas.

## Backend (Edge Function)

Uma função pública `property-feed` que recebe `?slug=...&format=vrsync|imovelweb` e devolve `Content-Type: application/xml`. Sem JWT (`verify_jwt = false`) — portais não autenticam.

Para dar a URL bonita `/feed/<slug>/vrsync.xml` em vez de query string, o `index.html` / Vite não roda no backend, então a função é exposta direto pela URL da edge function e mostramos isso pro corretor. Se quiser URL própria do domínio depois, basta um proxy em `vite.config` para dev e um rewrite no host de produção — fica fora deste plano para não inflar o escopo.

### Formato VRSync (ZAP/Viva Real/OLX)

Estrutura mínima validada pelos portais:

```text
<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Imoveis>
    <Listing>
      <ListID>{id}</ListID>
      <Title>{titulo}</Title>
      <TransactionType>For Sale</TransactionType>
      <ListPrice currency="BRL">{preco}</ListPrice>
      <PropertyType>{tipo VRSync: Residential/Commercial}</PropertyType>
      <PropertySubType>{Apartment/House/Land/...}</PropertySubType>
      <Details>
        <LivingArea unit="square metres">{area}</LivingArea>
        <Bedrooms>{quartos}</Bedrooms>
        <Bathrooms>{banheiros}</Bathrooms>
        <Garage type="Parking Space">{vagas}</Garage>
        <Description>{descricao com CDATA}</Description>
        <Features><Feature>...</Feature></Features>
      </Details>
      <Location displayAddress="Neighborhood">
        <Country>BR</Country>
        <State>{estado}</State>
        <City>{cidade}</City>
        <Neighborhood>{bairro}</Neighborhood>
        <Address>{endereco}, {numero}</Address>
        <PostalCode>{cep}</PostalCode>
        <Latitude>{latitude}</Latitude>
        <Longitude>{longitude}</Longitude>
      </Location>
      <Media>
        <Item medium="image" caption="Foto" primary="true">{url}</Item>
      </Media>
      <ContactInfo>
        <Name>{corretor_nome}</Name>
        <Telephone>{telefone_normalizado}</Telephone>
        <Email>{email}</Email>
      </ContactInfo>
    </Listing>
  </Imoveis>
</Carga>
```

### Formato Imovelweb

Estrutura aceita pelo Imovelweb / ImóvelGuide (raiz `<Carga><Imoveis><Imovel>`):

```text
<?xml version="1.0" encoding="UTF-8"?>
<Carga>
  <Imoveis>
    <Imovel>
      <CodigoImovel>{id}</CodigoImovel>
      <TipoImovel>{Apartamento/Casa/Terreno/...}</TipoImovel>
      <SubTipoImovel>{Padrão/Cobertura/...}</SubTipoImovel>
      <TituloImovel>{titulo}</TituloImovel>
      <Observacao><![CDATA[{descricao}]]></Observacao>
      <Modelo>Venda</Modelo>
      <Cidade>{cidade}</Cidade>
      <UF>{estado}</UF>
      <Bairro>{bairro}</Bairro>
      <CEP>{cep}</CEP>
      <Endereco>{endereco}</Endereco>
      <Numero>{numero}</Numero>
      <Latitude>{latitude}</Latitude>
      <Longitude>{longitude}</Longitude>
      <PrecoVenda>{preco}</PrecoVenda>
      <AreaUtil>{area_privativa}</AreaUtil>
      <AreaTotal>{area}</AreaTotal>
      <QtdDormitorios>{quartos}</QtdDormitorios>
      <QtdSuites>0</QtdSuites>
      <QtdBanheiros>{banheiros}</QtdBanheiros>
      <QtdVagas>{vagas}</QtdVagas>
      <Fotos>
        <Foto>
          <URLArquivo>{url}</URLArquivo>
          <NomeArquivo>{filename}</NomeArquivo>
          <Principal>1|0</Principal>
        </Foto>
      </Fotos>
      <DataAtualizacao>{ISO}</DataAtualizacao>
    </Imovel>
  </Imoveis>
</Carga>
```

### Detalhes técnicos da função

- Resolve `slug → user_id` lendo `profiles` (mesma lógica do `BrokerSite`).
- Busca `imoveis` desse `user_id` (e dos corretores da imobiliária se for conta `imobiliaria`) filtrando pelas regras acima.
- Mapeia `tipo` interno → `PropertyType/SubType` (tabela fixa: Apartamento→Residential/Apartment, Casa→Residential/House, Terreno→Land, Sala Comercial→Commercial/CommercialSpace, etc.).
- Escapa caracteres XML (`& < > " '`) e envolve descrições em `CDATA`.
- Define cabeçalhos `Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=900` (15 min) e `Last-Modified` baseado no maior `updated_at`.
- Responde `404` se slug não existir, `200` com `<Imoveis/>` vazio se corretor não tem imóveis ativos.

## Mudanças no banco

Migration única:

- `ALTER TABLE imoveis ADD COLUMN publicar_xml boolean NOT NULL DEFAULT true;`
- Backfill nenhum (default já cobre).
- Sem RLS nova — a função usa `service_role`.

## Mudanças no frontend

1. `CadastroImovel.tsx` — novo switch "Publicar nos portais (XML)" no bloco "Configurações de Publicação", ligado ao campo `publicar_xml`.
2. Nova página/aba em `src/pages/Settings.tsx` (ou nova `BrokerXmlFeeds.tsx` dentro do BrokerLayout) com:
   - Lista das 2 URLs + botão copiar (`navigator.clipboard`).
   - Instruções por portal em accordion.
   - Contador de imóveis no feed (consulta rápida ao banco).
3. Item de menu "Feeds XML" no `BrokerSidebar`.

## O que NÃO entra agora

- URL bonita no domínio próprio (continua sendo a URL da edge function).
- OpenImob e Mercado Livre (não foram selecionados).
- Painel de log/diagnóstico de leitura dos portais.

## Como o corretor usará

1. Copia o link VRSync.
2. Cola em **Painel ZAP/Viva Real → Integração → XML** (ou painel do Imovelweb).
3. Portal lê o XML a cada algumas horas e cria/atualiza os anúncios automaticamente.
