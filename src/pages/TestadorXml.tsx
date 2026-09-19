import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Maximize,
  Ruler,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type XmlField = {
  label: string;
  value: string;
  source?: {
    tag: string;
    path: string;
    value: string;
  };
};

type ParsedProperty = {
  id: string;
  batchId: string;
  fileName: string;
  importedAt: string;
  index: number;
  sourceNode: string;
  fields: Record<FieldKey, XmlField>;
  photos: string[];
  features: string[];
  rawFields: XmlField[];
  missing: FieldKey[];
};

type ParsedBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  total: number;
  rootNode: string;
};

type XmlState = {
  batches: ParsedBatch[];
  properties: ParsedProperty[];
};

type FieldKey =
  | "codigo"
  | "titulo"
  | "tipo"
  | "preco"
  | "condominio"
  | "area"
  | "area_privativa"
  | "quartos"
  | "suites"
  | "banheiros"
  | "vagas"
  | "endereco"
  | "numero"
  | "bairro"
  | "cidade"
  | "estado"
  | "cep"
  | "descricao";

const STORAGE_KEY = "mv-connect:testador-xml:v2";

const EMPTY_STATE: XmlState = { batches: [], properties: [] };

const FIELD_DEFS: Array<{ key: FieldKey; label: string; tags: string[] }> = [
  { key: "codigo", label: "Código", tags: ["ListingID", "CodigoImovel", "Codigo", "Reference", "Referencia", "Ref", "id"] },
  { key: "titulo", label: "Título", tags: ["Title", "Titulo", "TituloImovel", "Nome", "Name"] },
  { key: "tipo", label: "Tipo", tags: ["PropertyType", "TipoImovel", "Tipo", "Categoria", "SubTipo"] },
  { key: "preco", label: "Preço", tags: ["ListPrice", "Price", "PrecoVenda", "Preco", "Valor", "ValorVenda"] },
  { key: "condominio", label: "Condomínio", tags: ["CondoFee", "PrecoCondominio", "ValorCondominio", "Condominio"] },
  { key: "area", label: "Área total", tags: ["LivingArea", "LotArea", "AreaTotal", "AreaTerreno", "Area"] },
  { key: "area_privativa", label: "Área privativa", tags: ["PrivateArea", "AreaUtil", "AreaPrivativa", "AreaConstruida"] },
  { key: "quartos", label: "Dormitórios", tags: ["Bedrooms", "Quartos", "Dormitorios", "Dormitorio"] },
  { key: "suites", label: "Suítes", tags: ["Suites", "Suite"] },
  { key: "banheiros", label: "Banheiros", tags: ["Bathrooms", "Banheiros", "Banheiro"] },
  { key: "vagas", label: "Vagas", tags: ["Garage", "Garages", "Vagas", "Vaga"] },
  { key: "endereco", label: "Endereço", tags: ["Address", "Logradouro", "Endereco", "Rua"] },
  { key: "numero", label: "Número", tags: ["StreetNumber", "Numero", "Número"] },
  { key: "bairro", label: "Bairro", tags: ["Neighborhood", "Bairro"] },
  { key: "cidade", label: "Cidade", tags: ["City", "Cidade"] },
  { key: "estado", label: "UF", tags: ["State", "UF", "Estado"] },
  { key: "cep", label: "CEP", tags: ["PostalCode", "CEP", "Cep"] },
  { key: "descricao", label: "Descrição", tags: ["Description", "Descricao", "Descrição", "Observacoes", "Observações"] },
];

const REQUIRED_FIELDS: FieldKey[] = ["codigo", "titulo", "tipo", "preco", "cidade", "bairro", "endereco"];

const PROPERTY_NODE_NAMES = [
  "listing",
  "imovel",
  "property",
  "propertylisting",
  "item",
  "unidade",
];

const PHOTO_NODE_NAMES = [
  "foto",
  "fotos",
  "photo",
  "photos",
  "image",
  "images",
  "media",
  "urlarquivo",
  "url",
];

const FEATURE_NODE_NAMES = [
  "feature",
  "features",
  "caracteristica",
  "caracteristicas",
  "infraestrutura",
  "amenities",
  "amenity",
];

const currency = (value?: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const only = raw.replace(/[^\d,.-]/g, "");
  const normalized = only.includes(",")
    ? Number(only.replace(/\./g, "").replace(",", "."))
    : Number(only);
  if (!Number.isFinite(normalized) || normalized <= 0) return raw;
  return normalized.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
};

const text = (value?: string | null) => String(value || "").replace(/\s+/g, " ").trim();

const norm = (value?: string | null) =>
  text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

function nodeName(node: Element) {
  return node.localName || node.nodeName;
}

function nodeKey(node: Element) {
  return norm(nodeName(node));
}

function fieldPath(node: Element, root: Element) {
  const parts: string[] = [];
  let current: Element | null = node;
  while (current && current !== root.parentElement) {
    parts.unshift(nodeName(current));
    if (current === root) break;
    current = current.parentElement;
  }
  return parts.join(" > ");
}

function directText(node: Element) {
  let value = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      value += child.textContent || "";
    }
  });
  return text(value);
}

function allDescendants(node: Element) {
  return Array.from(node.getElementsByTagName("*")) as Element[];
}

function findField(root: Element, tags: string[]): XmlField {
  const wanted = new Set(tags.map(norm));
  const candidates = [root, ...allDescendants(root)];
  for (const element of candidates) {
    if (!wanted.has(nodeKey(element))) continue;
    const value = directText(element) || text(element.textContent);
    if (!value) continue;
    return {
      label: "",
      value,
      source: {
        tag: nodeName(element),
        path: fieldPath(element, root),
        value,
      },
    };
  }
  return { label: "", value: "" };
}

function findRawFields(root: Element) {
  return allDescendants(root)
    .map((element) => {
      const value = directText(element);
      if (!value) return null;
      return {
        label: nodeName(element),
        value,
        source: {
          tag: nodeName(element),
          path: fieldPath(element, root),
          value,
        },
      };
    })
    .filter(Boolean)
    .slice(0, 80) as XmlField[];
}

function extractUrlsFromText(value: string) {
  return Array.from(value.matchAll(/https?:\/\/[^\s<>"']+/gi)).map((match) =>
    match[0].replace(/[),.;]+$/, ""),
  );
}

function extractPhotos(root: Element) {
  const urls = new Set<string>();
  const elements = [root, ...allDescendants(root)];
  for (const element of elements) {
    const isPhotoContext = PHOTO_NODE_NAMES.some((name) => nodeKey(element).includes(norm(name)));
    const attrs = Array.from(element.attributes || []);
    for (const attr of attrs) {
      const value = text(attr.value);
      if (/^https?:\/\//i.test(value) && (isPhotoContext || /\.(jpe?g|png|webp|avif)(\?|$)/i.test(value))) {
        urls.add(value);
      }
    }
    const value = directText(element);
    for (const url of extractUrlsFromText(value)) {
      if (isPhotoContext || /\.(jpe?g|png|webp|avif)(\?|$)/i.test(url)) urls.add(url);
    }
  }
  return Array.from(urls).slice(0, 60);
}

function extractFeatures(root: Element) {
  const values = new Set<string>();
  for (const element of allDescendants(root)) {
    const key = nodeKey(element);
    if (!FEATURE_NODE_NAMES.some((name) => key.includes(norm(name)))) continue;
    const value = directText(element);
    if (value && !/^https?:\/\//i.test(value)) values.add(value);
    Array.from(element.children).forEach((child) => {
      const childValue = directText(child);
      if (childValue && !/^https?:\/\//i.test(childValue)) values.add(childValue);
    });
  }
  return Array.from(values).slice(0, 40);
}

function hasPropertySignals(node: Element) {
  const keys = new Set(allDescendants(node).map(nodeKey));
  const signals = ["preco", "price", "listprice", "cidade", "city", "titulo", "title", "tipoimovel", "propertytype"];
  return signals.some((signal) => keys.has(signal));
}

function findPropertyNodes(doc: Document) {
  const all = Array.from(doc.getElementsByTagName("*")) as Element[];
  const named = all.filter((node) => PROPERTY_NODE_NAMES.includes(nodeKey(node)) && hasPropertySignals(node));
  if (named.length) return named;

  const listings = all.filter((node) => ["listing", "imovel"].includes(nodeKey(node)));
  if (listings.length) return listings;

  const root = doc.documentElement;
  const children = Array.from(root.children) as Element[];
  if (children.length > 1) return children.filter(hasPropertySignals);
  return hasPropertySignals(root) ? [root] : [];
}

function parseXml(xmlText: string, fileName: string): XmlState {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error(text(parseError.textContent) || "XML inválido");

  const nodes = findPropertyNodes(doc);
  if (!nodes.length) throw new Error("Nenhum imóvel encontrado no XML.");

  const batchId = crypto.randomUUID();
  const importedAt = new Date().toISOString();
  const properties = nodes.map((node, index) => {
    const fields = FIELD_DEFS.reduce((acc, def) => {
      const field = findField(node, def.tags);
      acc[def.key] = { ...field, label: def.label };
      return acc;
    }, {} as Record<FieldKey, XmlField>);
    const missing = REQUIRED_FIELDS.filter((key) => !fields[key]?.value);
    const code = fields.codigo.value || `${fileName}-${index + 1}`;
    return {
      id: `${batchId}-${index}-${code}`.replace(/\s+/g, "-"),
      batchId,
      fileName,
      importedAt,
      index: index + 1,
      sourceNode: nodeName(node),
      fields,
      photos: extractPhotos(node),
      features: extractFeatures(node),
      rawFields: findRawFields(node),
      missing,
    };
  });

  return {
    batches: [{ id: batchId, fileName, importedAt, total: properties.length, rootNode: nodeName(doc.documentElement) }],
    properties,
  };
}

function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as XmlState;
    if (!Array.isArray(parsed.properties) || !Array.isArray(parsed.batches)) return EMPTY_STATE;
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function propertyTitle(property: ParsedProperty) {
  return property.fields.titulo.value || property.fields.codigo.value || `Imóvel ${property.index}`;
}

function propertyAddress(property: ParsedProperty) {
  return [
    [property.fields.endereco.value, property.fields.numero.value].filter(Boolean).join(", "),
    property.fields.bairro.value,
    [property.fields.cidade.value, property.fields.estado.value].filter(Boolean).join(" - "),
    property.fields.cep.value,
  ].filter(Boolean).join(", ");
}

function propertyType(property: ParsedProperty) {
  return property.fields.tipo.value || "Imóvel";
}

export default function TestadorXml() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<XmlState>(() => getStoredState());
  const [selectedId, setSelectedId] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [xmlUrl, setXmlUrl] = useState("");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!selectedId && state.properties[0]?.id) setSelectedId(state.properties[0].id);
  }, [selectedId, state.properties]);

  const selected = useMemo(
    () => state.properties.find((property) => property.id === selectedId) || state.properties[0] || null,
    [selectedId, state.properties],
  );

  useEffect(() => {
    setPhotoIndex(0);
  }, [selected?.id]);

  const filtered = useMemo(() => {
    const needle = norm(query);
    return state.properties.filter((property) => {
      const matchesBatch = batchFilter === "all" || property.batchId === batchFilter;
      const haystack = [
        property.fields.codigo.value,
        property.fields.titulo.value,
        property.fields.tipo.value,
        property.fields.cidade.value,
        property.fields.bairro.value,
        property.fileName,
      ].filter(Boolean).join(" ");
      return matchesBatch && (!needle || norm(haystack).includes(needle));
    });
  }, [batchFilter, query, state.properties]);

  const totals = useMemo(() => {
    const incomplete = state.properties.filter((property) => property.missing.length > 0).length;
    const photos = state.properties.reduce((sum, property) => sum + property.photos.length, 0);
    return { incomplete, photos };
  }, [state.properties]);

  const addParsed = (items: XmlState[]) => {
    if (!items.length) return;
    setState((current) => ({
      batches: [...items.flatMap((item) => item.batches), ...current.batches],
      properties: [...items.flatMap((item) => item.properties), ...current.properties],
    }));
    setBatchFilter(items[0].batches[0].id);
    setSelectedId(items[0].properties[0]?.id || "");
    setSelectedIds([]);
    toast.success(`${items.reduce((sum, item) => sum + item.properties.length, 0)} imóveis importados.`);
  };

  const importFiles = async (files: FileList | File[]) => {
    const xmlFiles = Array.from(files).filter((file) => /\.xml$/i.test(file.name) || file.type.includes("xml"));
    if (!xmlFiles.length) {
      toast.error("Selecione um arquivo XML.");
      return;
    }
    const parsed: XmlState[] = [];
    for (const file of xmlFiles) {
      try {
        parsed.push(parseXml(await file.text(), file.name));
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "falha ao ler XML"}`);
      }
    }
    addParsed(parsed);
  };

  const fetchText = async (url: string) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const importUrl = async () => {
    const url = xmlUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Informe um link iniciado por http:// ou https://.");
      return;
    }
    setLoadingUrl(true);
    try {
      let xml = "";
      try {
        xml = await fetchText(url);
      } catch {
        xml = await fetchText(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      }
      const source = new URL(url);
      const name = decodeURIComponent(source.pathname.split("/").filter(Boolean).pop() || source.hostname || "xml-url");
      addParsed([parseXml(xml, name.endsWith(".xml") ? name : `${name}.xml`)]);
      setXmlUrl("");
    } catch (error) {
      toast.error(error instanceof Error ? `Não foi possível importar o XML: ${error.message}` : "Não foi possível importar o XML.");
    } finally {
      setLoadingUrl(false);
    }
  };

  const removeProperties = (ids: string[]) => {
    if (!ids.length) return;
    setState((current) => {
      const properties = current.properties.filter((property) => !ids.includes(property.id));
      const activeBatches = new Set(properties.map((property) => property.batchId));
      return {
        properties,
        batches: current.batches.filter((batch) => activeBatches.has(batch.id)),
      };
    });
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) {
      const next = state.properties.find((property) => !ids.includes(property.id));
      setSelectedId(next?.id || "");
    }
  };

  const removeBatch = (batchId: string) => {
    const ids = state.properties.filter((property) => property.batchId === batchId).map((property) => property.id);
    removeProperties(ids);
    setBatchFilter("all");
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleFiltered = () => {
    const ids = filtered.map((property) => property.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  const drop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    importFiles(event.dataTransfer.files);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Building2 className="h-4 w-4" />
              MV Broker Connect
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Testador de XML</h1>
            <p className="mt-1 text-sm text-muted-foreground">Importe o XML e confira o imóvel como ele aparece na página interna do Connect.</p>
          </div>
          <Button onClick={() => inputRef.current?.click()} className="w-full gap-2 sm:w-auto">
            <Upload className="h-4 w-4" />
            Importar XML
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
              className={cn(
                "flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white px-5 py-6 text-center transition",
                dragging ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) importFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <FileCode className="mb-3 h-9 w-9 text-primary" />
              <span className="font-medium">Solte ou selecione o XML</span>
              <span className="mt-1 text-sm text-muted-foreground">VRSync, Imovelweb ou XML geral</span>
            </label>

            <Card>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  Link do XML
                </div>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={xmlUrl}
                    onChange={(event) => setXmlUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        importUrl();
                      }
                    }}
                    placeholder="https://site.com/feed.xml"
                  />
                  <Button type="button" onClick={importUrl} disabled={loadingUrl || !xmlUrl.trim()} className="shrink-0 gap-2">
                    {loadingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Importar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <Metric label="Imóveis" value={state.properties.length} />
              <Metric label="XMLs" value={state.batches.length} />
              <Metric label="Alertas" value={totals.incomplete} />
            </div>

            <Card>
              <CardContent className="p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar imóvel" />
                </div>
                <select
                  value={batchFilter}
                  onChange={(event) => setBatchFilter(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Todos os XMLs salvos</option>
                  {state.batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.fileName} - {batch.total} imóveis
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={toggleFiltered} disabled={!filtered.length} className="gap-2">
                <Check className="h-4 w-4" />
                Selecionar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => removeProperties(selectedIds)} disabled={!selectedIds.length} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Apagar seleção
              </Button>
              {batchFilter !== "all" && (
                <Button variant="outline" size="sm" onClick={() => removeBatch(batchFilter)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Apagar XML
                </Button>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-470px)] min-h-[360px]">
              <div className="space-y-3 pr-3">
                {filtered.map((property) => (
                  <Card
                    key={property.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(property.id)}
                    className={cn("cursor-pointer rounded-lg transition hover:border-primary/60", selected?.id === property.id && "border-primary shadow-sm")}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{propertyTitle(property)}</p>
                          <p className="truncate text-xs text-muted-foreground">{property.fileName}</p>
                        </div>
                        <Checkbox
                          checked={selectedIds.includes(property.id)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={() => toggleSelected(property.id)}
                        />
                      </div>
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {property.fields.tipo.value && <Badge variant="secondary">{property.fields.tipo.value}</Badge>}
                        {property.missing.length > 0 ? (
                          <Badge variant="destructive">{property.missing.length} faltando</Badge>
                        ) : (
                          <Badge className="bg-emerald-600">Completo</Badge>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{propertyAddress(property) || "Endereço não informado"}</span>
                        </p>
                        <p className="font-medium text-foreground">{currency(property.fields.preco.value) || property.fields.preco.value || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!filtered.length && (
                  <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
                    Nenhum imóvel importado.
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          <section className="min-w-0">
            {selected ? (
              <XmlPropertyPreview property={selected} photoIndex={photoIndex} setPhotoIndex={setPhotoIndex} />
            ) : (
              <Card className="min-h-[720px]">
                <CardContent className="flex min-h-[720px] flex-col items-center justify-center p-8 text-center">
                  <FileCode className="h-12 w-12 text-muted-foreground/50" />
                  <h2 className="mt-4 text-xl font-semibold">Importe um XML para visualizar</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    O imóvel selecionado aparece aqui com o mesmo padrão visual da página interna do Connect.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function XmlPropertyPreview({
  property,
  photoIndex,
  setPhotoIndex,
}: {
  property: ParsedProperty;
  photoIndex: number;
  setPhotoIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const photos = property.photos;
  const currentPhoto = photos[photoIndex] || "";
  const stats = [
    { icon: BedDouble, value: property.fields.suites.value || property.fields.quartos.value || "-", label: property.fields.suites.value ? "Suítes" : "Dormitórios" },
    { icon: Bath, value: property.fields.banheiros.value || "-", label: "Banheiros" },
    { icon: Car, value: property.fields.vagas.value || "-", label: "Vagas" },
    { icon: Ruler, value: areaLabel(property.fields.area_privativa.value || property.fields.area.value), label: "Área" },
    { icon: Maximize, value: areaLabel(property.fields.area.value), label: "Terreno" },
  ];
  const address = propertyAddress(property);
  const detailRows = [
    ["Código do imóvel", property.fields.codigo.value],
    ["Tipo do imóvel", property.fields.tipo.value],
    ["Preço", currency(property.fields.preco.value) || property.fields.preco.value],
    ["Condomínio", currency(property.fields.condominio.value) || property.fields.condominio.value],
    ["Área privativa", areaLabel(property.fields.area_privativa.value)],
    ["Área total", areaLabel(property.fields.area.value)],
    ["Dormitórios", property.fields.quartos.value],
    ["Suítes", property.fields.suites.value],
    ["Banheiros", property.fields.banheiros.value],
    ["Vagas", property.fields.vagas.value],
    ["Cidade", [property.fields.cidade.value, property.fields.estado.value].filter(Boolean).join(" - ")],
    ["Bairro", property.fields.bairro.value],
    ["CEP", property.fields.cep.value],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl">
        <div className="relative aspect-[4/3] bg-slate-950 sm:aspect-video">
          {currentPhoto ? (
            <img src={currentPhoto} alt={propertyTitle(property)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-white/60">
              <ImageIcon className="h-14 w-14" />
              <p className="mt-2 text-sm">Sem imagem no XML</p>
            </div>
          )}
          {photos.length > 0 && (
            <Badge className="absolute right-3 top-3 bg-slate-950/70 text-white hover:bg-slate-950/70">
              {photoIndex + 1}/{photos.length}
            </Badge>
          )}
          {photos.length > 1 && (
            <>
              <button
                aria-label="Foto anterior"
                onClick={() => setPhotoIndex((current) => (current - 1 + photos.length) % photos.length)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Próxima foto"
                onClick={() => setPhotoIndex((current) => (current + 1) % photos.length)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t bg-white p-3">
            {photos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                onClick={() => setPhotoIndex(index)}
                className={cn(
                  "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-32",
                  index === photoIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img src={photo} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{property.fields.tipo.value || "Imóvel"}</Badge>
            <Badge variant="outline">XML: &lt;{property.sourceNode}&gt;</Badge>
            <Badge variant={property.missing.length ? "destructive" : "secondary"}>
              {property.missing.length ? `${property.missing.length} campos faltando` : "Completo"}
            </Badge>
          </div>

          <h2 className="mt-3 text-2xl font-black leading-tight text-foreground sm:text-3xl">
            {propertyTitle(property)}
          </h2>
          {address && (
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{address}</span>
            </p>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-3xl font-black text-primary">{currency(property.fields.preco.value) || property.fields.preco.value || "Preço não informado"}</p>
              {property.fields.condominio.value && (
                <p className="mt-1 text-xs text-muted-foreground">Condomínio: {currency(property.fields.condominio.value) || property.fields.condominio.value}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border bg-muted/30 px-3 py-3 text-center">
                  <stat.icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-1 text-sm font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-base font-bold text-foreground">Sobre o imóvel</h3>
            {property.fields.descricao.value ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{property.fields.descricao.value}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Descrição não encontrada no XML.</p>
            )}
            {property.features.length > 0 && (
              <div className="mt-5 grid gap-2 border-t pt-5 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <span key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-base font-bold text-foreground">Ficha técnica</h3>
            <dl className="mt-3 divide-y divide-border">
              {detailRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-right text-xs font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Auditoria do XML</h3>
              <p className="text-xs text-muted-foreground">Campos encontrados e origem dentro do arquivo.</p>
            </div>
            {property.missing.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Faltando: {property.missing.map((key) => FIELD_DEFS.find((field) => field.key === key)?.label || key).join(", ")}
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {FIELD_DEFS.map((def) => {
              const field = property.fields[def.key];
              return (
                <div key={def.key} className="rounded-lg border bg-background px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{def.label}</span>
                    {field.source ? (
                      <span className="truncate text-[10px] text-muted-foreground" title={field.source.path}>
                        &lt;{field.source.tag}&gt;
                      </span>
                    ) : null}
                  </div>
                  <p className="break-words text-sm text-foreground">{field.value || "-"}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function areaLabel(value?: string) {
  const raw = text(value);
  if (!raw) return "-";
  if (/m²|m2/i.test(raw)) return raw;
  return `${raw} m²`;
}
