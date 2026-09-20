import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  CheckSquare,
  CircleHelp,
  Database,
  FileText,
  Home,
  Image as ImageIcon,
  Link2,
  Loader2,
  MapPin,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { normalizePropertyType } from "@/lib/propertyTypeRules";

type SourceInfo = {
  tag: string;
  path: string;
  value: string;
};

type ImportedField = {
  label: string;
  value: string;
  source?: SourceInfo;
};

type RawXmlField = SourceInfo & {
  parent: string;
};

type ImportedProperty = {
  id: string;
  batchId: string;
  fileName: string;
  importedAt: string;
  index: number;
  sourceNode: string;
  fields: Record<string, ImportedField>;
  photos: SourceInfo[];
  features: SourceInfo[];
  rawFields: RawXmlField[];
  missing: string[];
};

type ImportBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  total: number;
  rootNode: string;
};

type StoredImportState = {
  batches: ImportBatch[];
  properties: ImportedProperty[];
};

type FieldConfig = {
  key: string;
  label: string;
  tags: string[];
};

const STORAGE_KEY = "mvbroker_xml_tester_imports_v1";

const FIELD_CONFIGS: FieldConfig[] = [
  { key: "codigo", label: "Codigo", tags: ["CodigoImovel", "Codigo", "ListID", "ListingID", "ID", "Reference", "Referencia"] },
  { key: "titulo", label: "Titulo", tags: ["TituloImovel", "Title", "Titulo", "DescricaoTitulo", "Nome"] },
  { key: "tipo", label: "Tipo", tags: ["TipoImovel", "TipoPadraoMV", "PropertySubType", "SubTipoImovel", "Tipo", "PropertyType"] },
  { key: "operacao", label: "Operacao", tags: ["Modelo", "TransactionType", "Finalidade", "Operacao"] },
  { key: "preco", label: "Preco", tags: ["PrecoVenda", "ListPrice", "Price", "Valor", "Preco"] },
  { key: "descricao", label: "Descricao", tags: ["Observacao", "Description", "Descricao"] },
  { key: "cidade", label: "Cidade", tags: ["Cidade", "City"] },
  { key: "uf", label: "UF", tags: ["UF", "State", "Estado"] },
  { key: "bairro", label: "Bairro", tags: ["Bairro", "Neighborhood"] },
  { key: "endereco", label: "Endereco", tags: ["Endereco", "Address", "Logradouro"] },
  { key: "numero", label: "Numero", tags: ["Numero", "Number", "StreetNumber"] },
  { key: "unidade", label: "Unidade", tags: ["Unidade", "UnitNumber", "Apto", "Apartamento"] },
  { key: "quadra", label: "QD", tags: ["Quadra", "Block", "QD"] },
  { key: "lote", label: "LT", tags: ["Lote", "Lot", "LT"] },
  { key: "complemento", label: "Complemento", tags: ["Complemento"] },
  { key: "cep", label: "CEP", tags: ["CEP", "PostalCode"] },
  { key: "latitude", label: "Latitude", tags: ["Latitude", "Lat"] },
  { key: "longitude", label: "Longitude", tags: ["Longitude", "Lng", "Lon"] },
  { key: "areaUtil", label: "Area util", tags: ["AreaUtil", "LivingArea", "AreaPrivativa", "Area"] },
  { key: "areaTotal", label: "Area total", tags: ["AreaTotal", "LotArea", "Terreno"] },
  { key: "dormitorios", label: "Dormitorios", tags: ["QtdDormitorios", "Bedrooms", "Dormitorios", "Quartos"] },
  { key: "suites", label: "Suites", tags: ["QtdSuites", "Suites"] },
  { key: "banheiros", label: "Banheiros", tags: ["QtdBanheiros", "Bathrooms", "Banheiros"] },
  { key: "vagas", label: "Vagas", tags: ["QtdVagas", "Garage", "Vagas"] },
  { key: "condominio", label: "Condominio", tags: ["Condominio", "Empreendimento", "Building", "Development"] },
  { key: "contatoNome", label: "Contato", tags: ["NomeContato", "Name", "Contato"] },
  { key: "contatoEmail", label: "E-mail", tags: ["EmailContato", "Email"] },
  { key: "contatoTelefone", label: "Telefone", tags: ["TelefoneContato", "Telephone", "Phone", "Telefone"] },
  { key: "atualizadoEm", label: "Atualizado em", tags: ["DataAtualizacao", "UpdatedAt", "ModificationTimestamp"] },
];

const REQUIRED_KEYS = ["codigo", "titulo", "tipo", "preco", "cidade", "bairro", "endereco"];
const PROPERTY_NODE_NAMES = ["imovel", "listing", "property", "listingdata"];
const PHOTO_TAGS = ["urlarquivo", "item", "foto", "imagem", "image", "picture", "url"];
const FEATURE_TAGS = ["feature", "caracteristica", "destaque", "amenity"];

const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const tagName = (node: Element) => node.localName || node.nodeName;
const nodeText = (node: Element) => (node.textContent || "").replace(/\s+/g, " ").trim();
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

const normalizeXmlPropertyTypeFromTexts = (value: string, title = "", description = "") => {
  const raw = normalize(value);
  const text = `${raw} ${normalize(title)} ${normalize(description)}`;

  if (/(condo|condominio|condominium|condominial|gated)/.test(text)) {
    if (/(lote|terreno|land|allotment)/.test(text)) return "Lote em condominio";
    return "Casa em condominio";
  }
  if (/(home|house|casa|sobrado)/.test(text)) return "Casa";
  if (/(lote|terreno|land|allotment)/.test(text)) return "Lote";
  return normalizePropertyType(value);
};

const normalizeXmlPropertyType = (value: string, node: Element) =>
  normalizeXmlPropertyTypeFromTexts(
    value,
    firstTextByTags(node, ["TituloImovel", "Title", "Titulo", "Nome"])?.value || "",
    firstTextByTags(node, ["Observacao", "Description", "Descricao"])?.value || "",
  );

const normalizeStoredPropertyType = (property: ImportedProperty): ImportedProperty => {
  const fields = FIELD_CONFIGS.reduce<Record<string, ImportedField>>((acc, config) => {
    acc[config.key] = property.fields?.[config.key] || { label: config.label, value: "" };
    return acc;
  }, {});
  const tipo = fields.tipo;
  const rawType = tipo?.source?.value || tipo?.value || "";
  const normalizedType = normalizeXmlPropertyTypeFromTexts(
    rawType,
    fields.titulo?.value || "",
    fields.descricao?.value || "",
  );

  return {
    ...property,
    fields: {
      ...fields,
      tipo: {
        ...tipo,
        value: normalizedType,
      },
    },
    missing: REQUIRED_KEYS.filter((key) => {
      if (key === "tipo") return !normalizedType;
      return !fields[key]?.value;
    }),
  };
};

const normalizeStoredState = (state: StoredImportState): StoredImportState => ({
  batches: Array.isArray(state.batches) ? state.batches : [],
  properties: Array.isArray(state.properties) ? state.properties.map(normalizeStoredPropertyType) : [],
});

const formatImportedAddress = (property: ImportedProperty) => {
  const endereco = property.fields.endereco?.value || "";
  const numero = property.fields.numero?.value || "";
  const addressLine = [endereco, numero].filter(Boolean).join(", ");
  return [addressLine, property.fields.bairro?.value, property.fields.cidade?.value, property.fields.uf?.value]
    .filter(Boolean)
    .join(", ") || "Endereco nao informado";
};

const loadStoredImportState = (): StoredImportState => {
  if (typeof window === "undefined") return { batches: [], properties: [] };
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { batches: [], properties: [] };

  try {
    return normalizeStoredState(JSON.parse(saved) as StoredImportState);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return { batches: [], properties: [] };
  }
};

const formatCurrency = (value?: string) => {
  if (!value) return "";
  const numeric = Number(String(value).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", "."));
  if (!Number.isFinite(numeric)) return value;
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const getElementPath = (node: Element, stopAt?: Element) => {
  const parts: string[] = [];
  let current: Element | null = node;
  while (current && current.nodeType === 1) {
    parts.unshift(tagName(current));
    if (current === stopAt) break;
    current = current.parentElement;
  }
  return `/${parts.join("/")}`;
};

const firstTextByTags = (root: Element, tags: string[]): SourceInfo | undefined => {
  const wanted = tags.map(normalize);
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode as Element;

  while (current) {
    if (wanted.includes(normalize(tagName(current)))) {
      const value = nodeText(current);
      if (value) return { tag: tagName(current), path: getElementPath(current, root), value };
    }
    current = walker.nextNode() as Element;
  }

  return undefined;
};

const collectRawFields = (root: Element) => {
  const fields: RawXmlField[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode as Element;

  while (current) {
    const hasElementChildren = Array.from(current.children).length > 0;
    const value = nodeText(current);
    if (!hasElementChildren && value) {
      fields.push({
        tag: tagName(current),
        parent: current.parentElement ? tagName(current.parentElement) : tagName(root),
        path: getElementPath(current, root),
        value,
      });
    }
    current = walker.nextNode() as Element;
  }

  return fields;
};

const collectValuesByTags = (root: Element, tags: string[]) => {
  const wanted = tags.map(normalize);
  const values: SourceInfo[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode as Element;

  while (current) {
    if (wanted.includes(normalize(tagName(current)))) {
      const value = nodeText(current);
      if (value) values.push({ tag: tagName(current), path: getElementPath(current, root), value });
    }
    current = walker.nextNode() as Element;
  }

  return values;
};

const findPropertyNodes = (doc: XMLDocument) => {
  const root = doc.documentElement;
  const nodes = Array.from(root.getElementsByTagName("*")).filter((node) =>
    PROPERTY_NODE_NAMES.includes(normalize(tagName(node))),
  );

  if (nodes.length > 0) return nodes;

  const imoveis = Array.from(root.getElementsByTagName("*")).find((node) => normalize(tagName(node)) === "imoveis");
  if (imoveis) return Array.from(imoveis.children);

  return Array.from(root.children);
};

const parseXmlFile = (xmlText: string, fileName: string): StoredImportState => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const error = doc.querySelector("parsererror");

  if (error) {
    throw new Error(nodeText(error) || "XML invalido");
  }

  const batchId = crypto.randomUUID();
  const importedAt = new Date().toISOString();
  const propertyNodes = findPropertyNodes(doc);

  if (!propertyNodes.length) {
    throw new Error("Nenhum imovel encontrado no XML.");
  }

  const properties = propertyNodes.map((node, index) => {
    const fields = FIELD_CONFIGS.reduce<Record<string, ImportedField>>((acc, config) => {
      const source = firstTextByTags(node, config.tags);
      acc[config.key] = {
        label: config.label,
        value: config.key === "tipo" && source?.value ? normalizeXmlPropertyType(source.value, node) : source?.value || "",
        source,
      };
      return acc;
    }, {});

    const rawFields = collectRawFields(node);
    const photos = collectValuesByTags(node, PHOTO_TAGS)
      .filter((photo) => /^https?:\/\//i.test(photo.value))
      .slice(0, 30);
    const features = collectValuesByTags(node, FEATURE_TAGS).slice(0, 60);
    const missing = REQUIRED_KEYS.filter((key) => !fields[key]?.value);
    const stableCode = fields.codigo?.value || `${fileName}-${index + 1}`;

    return {
      id: `${batchId}-${index}-${stableCode}`.replace(/\s+/g, "-"),
      batchId,
      fileName,
      importedAt,
      index: index + 1,
      sourceNode: tagName(node),
      fields,
      photos,
      features,
      rawFields,
      missing,
    };
  });

  return {
    batches: [
      {
        id: batchId,
        fileName,
        importedAt,
        total: properties.length,
        rootNode: tagName(doc.documentElement),
      },
    ],
    properties,
  };
};

const FieldSourceHint = ({ source }: { source?: SourceInfo }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Origem no XML"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      {source ? (
        <div className="space-y-1">
          <p className="font-medium">XML: &lt;{source.tag}&gt;</p>
          <p className="break-all text-xs text-muted-foreground">{source.path}</p>
          <p className="line-clamp-3 text-xs">{source.value}</p>
        </div>
      ) : (
        <p>Campo nao encontrado no XML importado.</p>
      )}
    </TooltipContent>
  </Tooltip>
);

const DetailField = ({ field }: { field: ImportedField }) => (
  <div className="rounded-md border border-border/70 bg-background px-3 py-2">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</span>
      <FieldSourceHint source={field.source} />
    </div>
    <p className="break-words text-sm text-foreground">{field.value || "-"}</p>
  </div>
);

const XmlImportTester = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<StoredImportState>(loadStoredImportState);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [xmlUrl, setXmlUrl] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!selectedId && state.properties[0]?.id) {
      setSelectedId(state.properties[0].id);
    }
  }, [selectedId, state.properties]);

  const selectedProperty = useMemo(
    () => state.properties.find((property) => property.id === selectedId) || state.properties[0],
    [selectedId, state.properties],
  );

  const filteredProperties = useMemo(() => {
    const term = normalize(query);
    return state.properties.filter((property) => {
      const byBatch = selectedBatchId === "all" || property.batchId === selectedBatchId;
      const searchable = [
        property.fields.codigo?.value,
        property.fields.titulo?.value,
        property.fields.tipo?.value,
        property.fields.cidade?.value,
        property.fields.bairro?.value,
        property.fileName,
      ]
        .filter(Boolean)
        .join(" ");
      return byBatch && (!term || normalize(searchable).includes(term));
    });
  }, [query, selectedBatchId, state.properties]);

  const totals = useMemo(() => {
    const incomplete = state.properties.filter((property) => property.missing.length > 0).length;
    const photos = state.properties.reduce((sum, property) => sum + property.photos.length, 0);
    return { incomplete, photos };
  }, [state.properties]);

  const saveParsedImports = (parsedImports: StoredImportState[]) => {
    if (!parsedImports.length) return;

    setState((current) => ({
      batches: [...parsedImports.flatMap((item) => item.batches), ...current.batches],
      properties: [...parsedImports.flatMap((item) => item.properties).map(normalizeStoredPropertyType), ...current.properties],
    }));
    setSelectedBatchId(parsedImports[0].batches[0].id);
    setSelectedId(parsedImports[0].properties[0]?.id || "");
    setSelectedForDelete([]);
    toast.success(`${parsedImports.reduce((sum, item) => sum + item.properties.length, 0)} imoveis importados.`);
  };

  const importFiles = async (files: FileList | File[]) => {
    const xmlFiles = Array.from(files).filter((file) => /\.xml$/i.test(file.name) || file.type.includes("xml"));
    if (!xmlFiles.length) {
      toast.error("Selecione um arquivo XML.");
      return;
    }

    const parsedImports: StoredImportState[] = [];

    for (const file of xmlFiles) {
      try {
        parsedImports.push(parseXmlFile(await file.text(), file.name));
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "falha ao ler XML"}`);
      }
    }

    saveParsedImports(parsedImports);
  };

  const fetchXmlText = async (url: string) => {
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

  const importFromUrl = async () => {
    const url = xmlUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Informe um link iniciado por http:// ou https://.");
      return;
    }

    setIsImportingUrl(true);
    try {
      let xmlText = "";
      try {
        xmlText = await fetchXmlText(url);
      } catch {
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        xmlText = await fetchXmlText(proxied);
      }

      const parsedUrl = new URL(url);
      const fileName = decodeURIComponent(parsedUrl.pathname.split("/").filter(Boolean).pop() || parsedUrl.hostname || "xml-url");
      const parsed = parseXmlFile(xmlText, fileName.endsWith(".xml") ? fileName : `${fileName}.xml`);
      saveParsedImports([parsed]);
      setXmlUrl("");
    } catch (error) {
      toast.error(error instanceof Error ? `Nao foi possivel importar o XML: ${error.message}` : "Nao foi possivel importar o XML.");
    } finally {
      setIsImportingUrl(false);
    }
  };

  const deleteProperties = (ids: string[]) => {
    if (!ids.length) return;
    setState((current) => {
      const remainingProperties = current.properties.filter((property) => !ids.includes(property.id));
      const usedBatchIds = new Set(remainingProperties.map((property) => property.batchId));
      return {
        properties: remainingProperties,
        batches: current.batches.filter((batch) => usedBatchIds.has(batch.id)),
      };
    });
    setSelectedForDelete([]);
    if (ids.includes(selectedProperty?.id || "")) {
      const next = state.properties.find((property) => !ids.includes(property.id));
      setSelectedId(next?.id || "");
    }
  };

  const deleteBatch = (batchId: string) => {
    const ids = state.properties.filter((property) => property.batchId === batchId).map((property) => property.id);
    deleteProperties(ids);
    setSelectedBatchId("all");
  };

  const toggleDeleteSelection = (id: string) => {
    setSelectedForDelete((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const selectVisible = () => {
    const ids = filteredProperties.map((property) => property.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedForDelete.includes(id));
    setSelectedForDelete(allSelected ? selectedForDelete.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedForDelete, ...ids])));
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    importFiles(event.dataTransfer.files);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Building2 className="h-4 w-4" />
              MV Broker
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Testador de XML</h1>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2 sm:w-auto">
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
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white px-5 py-6 text-center transition ${
                isDragging ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) importFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <FileText className="mb-3 h-9 w-9 text-primary" />
              <span className="font-medium">Solte ou selecione o XML</span>
              <span className="mt-1 text-sm text-muted-foreground">VRSync, Imovelweb ou XML geral</span>
            </label>

            <div className="rounded-lg border bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-primary" />
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
                      importFromUrl();
                    }
                  }}
                  placeholder="https://site.com/feed.xml"
                />
                <Button type="button" onClick={importFromUrl} disabled={isImportingUrl || !xmlUrl.trim()} className="shrink-0 gap-2">
                  {isImportingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Importar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xl font-semibold">{state.properties.length}</p>
                <p className="text-xs text-muted-foreground">Imoveis</p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xl font-semibold">{state.batches.length}</p>
                <p className="text-xs text-muted-foreground">XMLs</p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="text-xl font-semibold">{totals.incomplete}</p>
                <p className="text-xs text-muted-foreground">Alertas</p>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-3">
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar imovel" />
              </div>
              <select
                value={selectedBatchId}
                onChange={(event) => setSelectedBatchId(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Todos os XMLs salvos</option>
                {state.batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.fileName} - {batch.total} imoveis
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={selectVisible} disabled={!filteredProperties.length} className="gap-2">
                {filteredProperties.length && filteredProperties.every((property) => selectedForDelete.includes(property.id)) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Selecionar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteProperties(selectedForDelete)}
                disabled={!selectedForDelete.length}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Apagar lote
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-440px)] min-h-[360px]">
              <div className="space-y-3 pr-3">
                {filteredProperties.map((property) => (
                  <Card
                    key={property.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(property.id)}
                    className={`cursor-pointer rounded-lg transition hover:border-primary/60 ${
                      selectedProperty?.id === property.id ? "border-primary shadow-sm" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {property.fields.titulo?.value || property.fields.codigo?.value || `Imovel ${property.index}`}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{property.fileName}</p>
                        </div>
                        <Checkbox
                          checked={selectedForDelete.includes(property.id)}
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={() => toggleDeleteSelection(property.id)}
                        />
                      </div>
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {property.fields.tipo?.value && <Badge variant="secondary">{property.fields.tipo.value}</Badge>}
                        {property.missing.length > 0 ? (
                          <Badge variant="destructive">{property.missing.length} faltando</Badge>
                        ) : (
                          <Badge className="bg-emerald-600">Completo</Badge>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {formatImportedAddress(property)}
                          </span>
                        </p>
                        <p className="font-medium text-foreground">{formatCurrency(property.fields.preco?.value) || property.fields.preco?.value || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {!filteredProperties.length && (
                  <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
                    Nenhum imovel importado.
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          <section className="min-w-0 rounded-lg border bg-white">
            {selectedProperty ? (
              <div className="flex min-h-[720px] flex-col">
                <div className="border-b p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{selectedProperty.index}</Badge>
                        <Badge variant="secondary">&lt;{selectedProperty.sourceNode}&gt;</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(selectedProperty.importedAt)}</span>
                      </div>
                      <h2 className="break-words text-2xl font-semibold tracking-tight">
                        {selectedProperty.fields.titulo?.value || selectedProperty.fields.codigo?.value || "Imovel importado"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatImportedAddress(selectedProperty)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBatchId !== "all" && (
                        <Button variant="outline" size="sm" onClick={() => deleteBatch(selectedBatchId)} className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Apagar XML
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteProperties([selectedProperty.id])} className="gap-2">
                        <X className="h-4 w-4" />
                        Apagar imovel
                      </Button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-6 p-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Home className="h-4 w-4" />Tipo</p>
                        <p className="mt-1 font-semibold">{selectedProperty.fields.tipo?.value || "-"}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><BedDouble className="h-4 w-4" />Dormitorios</p>
                        <p className="mt-1 font-semibold">{selectedProperty.fields.dormitorios?.value || "-"}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Bath className="h-4 w-4" />Banheiros</p>
                        <p className="mt-1 font-semibold">{selectedProperty.fields.banheiros?.value || "-"}</p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground"><Car className="h-4 w-4" />Vagas</p>
                        <p className="mt-1 font-semibold">{selectedProperty.fields.vagas?.value || "-"}</p>
                      </div>
                    </div>

                    {selectedProperty.missing.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-medium text-amber-900">Campos principais nao encontrados</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedProperty.missing.map((key) => (
                            <Badge key={key} variant="outline" className="border-amber-300 text-amber-900">
                              {selectedProperty.fields[key]?.label || key}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        <Database className="h-4 w-4" />
                        Dados padronizados
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {FIELD_CONFIGS.map((config) => (
                          <DetailField key={config.key} field={selectedProperty.fields[config.key]} />
                        ))}
                      </div>
                    </div>

                    {selectedProperty.photos.length > 0 && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          Fotos
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {selectedProperty.photos.slice(0, 9).map((photo, index) => (
                            <a key={`${photo.path}-${index}`} href={photo.value} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-lg border bg-slate-100">
                              <img src={photo.value} alt="" className="h-32 w-full object-cover transition group-hover:scale-105" />
                              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
                                <span className="truncate">&lt;{photo.tag}&gt;</span>
                                <FieldSourceHint source={photo} />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProperty.features.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Caracteristicas</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.features.map((feature, index) => (
                            <Badge key={`${feature.path}-${index}`} variant="secondary" className="gap-1.5">
                              {feature.value}
                              <FieldSourceHint source={feature} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Todos os campos importados</h3>
                      <div className="overflow-hidden rounded-lg border">
                        <div className="grid grid-cols-[180px_1fr] border-b bg-slate-100 px-3 py-2 text-xs font-medium text-muted-foreground">
                          <span>Campo XML</span>
                          <span>Valor</span>
                        </div>
                        <div className="max-h-96 overflow-auto">
                          {selectedProperty.rawFields.map((field, index) => (
                            <div key={`${field.path}-${index}`} className="grid grid-cols-[180px_1fr] gap-3 border-b px-3 py-2 text-sm last:border-b-0">
                              <div className="min-w-0">
                                <p className="truncate font-medium">&lt;{field.tag}&gt;</p>
                                <p className="truncate text-xs text-muted-foreground">{field.path}</p>
                              </div>
                              <p className="break-words text-muted-foreground">{field.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex min-h-[720px] flex-col items-center justify-center p-8 text-center">
                <FileText className="mb-4 h-12 w-12 text-primary" />
                <h2 className="text-xl font-semibold">Importe um XML para testar</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  A lista de imoveis, os campos lidos e a origem de cada tag aparecem aqui.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};

export default XmlImportTester;
