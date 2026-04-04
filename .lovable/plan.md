

# Plano: Seleção de Endereço por Pin no Mapa

## Resumo
Adicionar um mini mapa interativo do Google Maps dentro do componente `CepAutoFill`, permitindo que o usuário clique no mapa para posicionar um pin e preencher automaticamente o endereço via **geocodificação reversa** (Google Geocoding API). Quando o CEP é preenchido, o mapa centraliza no endereço e atualiza as coordenadas.

## Mudanças

### 1. Atualizar `useGoogleMapsLoader` para carregar a biblioteca Geocoding
- Adicionar `geocoding` à lista de libraries no script do Google Maps: `libraries=marker,geocoding`

### 2. Criar componente `AddressMapPicker`
Novo componente que renderiza um mapa Google Maps clicável:
- Usa `useGoogleMapsLoader` para garantir que a API está carregada
- Renderiza um mapa com ~250px de altura dentro da seção de endereço
- Mostra um marcador na posição atual (latitude/longitude do form)
- **Clique no mapa**: posiciona o pin, faz geocodificação reversa via `google.maps.Geocoder`, e chama `onChange` com endereço, bairro, cidade, estado, CEP, latitude e longitude
- Centraliza automaticamente quando latitude/longitude mudam (ex: após busca por CEP)
- Posição inicial padrão: litoral do RS (-29.75, -50.05)

### 3. Atualizar `CepAutoFill`
- Importar e renderizar `AddressMapPicker` abaixo dos campos de latitude/longitude
- Quando o CEP é preenchido e o endereço é encontrado, as coordenadas já são atualizadas (já funciona), e o mapa reage centralizando no novo ponto
- Remover a seção separada de Latitude/Longitude dos formulários de edifício, condomínio e empreendimento (já estará dentro do CepAutoFill)

### 4. Atualizar formulários de cadastro
- `CadastroEdificio.tsx`: remover seção duplicada de Localização (lat/lng), pois já está no CepAutoFill
- `CadastroCondominio.tsx`: idem
- `CadastroEmpreendimento.tsx`: idem
- `CadastroImovel.tsx`: idem (verificar se já usa CepAutoFill com lat/lng)

## Detalhes técnicos
- A geocodificação reversa usa `new google.maps.Geocoder().geocode({ location: latLng })` — já incluso na Maps JavaScript API, sem necessidade de ativar APIs extras
- O componente de mapa observa mudanças de `latitude`/`longitude` via `useEffect` para reposicionar o marcador e centralizar
- O mapa usa `mapId: "address-picker"` com estilo roadmap padrão e zoom 15

