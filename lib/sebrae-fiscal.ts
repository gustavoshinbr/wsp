import { XMLParser, XMLValidator } from "fast-xml-parser";
import { ApiError } from "@/lib/validations";
import { onlyDigits } from "@/lib/utils";

export const SEBRAE_PORTALS = {
  homologacao: "https://sebrae.com.br/subsites/emissor-nf-e",
  producao: "https://emissornfe.sebrae.com.br",
} as const;

export type SebraeEnvironment = keyof typeof SEBRAE_PORTALS;

export type SebraeDraftPayload = {
  version: 1;
  preparedFor: "SEBRAE";
  issuer: {
    companyName: string;
    cnpj: string;
    stateRegistration: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  recipient: {
    name: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  sale: {
    id: string;
    createdAt: string;
    paymentMethod: string | null;
  };
  items: Array<{
    code: string;
    description: string;
    ncm: string;
    cfop: string;
    csosn: string;
    unit: string;
    origin: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  servicesExcluded: Array<{
    description: string;
    quantity: number;
    total: number;
  }>;
  totals: {
    products: number;
    servicesExcluded: number;
    sale: number;
  };
  notes: string[];
};

type XmlRecord = Record<string, unknown>;

function record(value: unknown): XmlRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as XmlRecord : {};
}

function text(value: unknown) {
  if (value == null) return "";
  if (typeof value === "object") {
    const content = record(value)["#text"];
    return content == null ? "" : String(content).trim();
  }
  return String(value).trim();
}

export function sebraePortalUrl(environment?: string | null) {
  return environment === "producao" ? SEBRAE_PORTALS.producao : SEBRAE_PORTALS.homologacao;
}

export function parseAuthorizedNfeXml(xml: string) {
  if (!xml.trim()) throw new ApiError("O arquivo XML está vazio.");
  if (xml.length > 3_000_000) throw new ApiError("O XML ultrapassa o limite de 3 MB.");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new ApiError("O XML contém uma declaração não permitida.");

  const validation = XMLValidator.validate(xml);
  if (validation !== true) throw new ApiError(`XML inválido: ${validation.err.msg}.`);

  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseTagValue: false,
    trimValues: true,
  }).parse(xml) as XmlRecord;
  const process = record(parsed.nfeProc || parsed);
  const nfe = record(process.NFe || parsed.NFe);
  const info = record(nfe.infNFe);
  const identification = record(info.ide);
  const issuer = record(info.emit);
  const totals = record(record(info.total).ICMSTot);
  const protocol = record(record(process.protNFe).infProt);
  const statusCode = text(protocol.cStat);
  const accessKey = onlyDigits(text(protocol.chNFe) || text(info["@Id"]).replace(/^NFe/i, ""));
  const model = text(identification.mod);

  if (model !== "55") throw new ApiError("Importe um XML de NF-e modelo 55 emitido pelo Sebrae.");
  if (!["100", "150"].includes(statusCode)) {
    throw new ApiError(`A NF-e ainda não está autorizada pela SEFAZ (${statusCode || "sem protocolo"}).`);
  }
  if (accessKey.length !== 44) throw new ApiError("O XML não contém uma chave de acesso válida.");

  return {
    number: text(identification.nNF),
    series: text(identification.serie),
    environment: text(identification.tpAmb) === "1" ? "producao" as const : "homologacao" as const,
    issuerDocument: onlyDigits(text(issuer.CNPJ) || text(issuer.CPF)),
    accessKey,
    protocol: text(protocol.nProt),
    statusCode,
    message: text(protocol.xMotivo) || "NF-e autorizada pela SEFAZ.",
    total: Number(text(totals.vNF) || 0),
    authorizedAt: text(protocol.dhRecbto) || null,
  };
}
