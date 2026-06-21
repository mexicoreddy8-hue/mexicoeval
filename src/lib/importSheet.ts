"use client";
import * as XLSX from "xlsx";

export interface ImportedStudent {
  name: string;
  qrtexto: string;
  site: string;
  slot: string;
  photo_url: string;   // CSV provides a path / url for the photo
  idcard_url: string;
}

const KEY_MAP: Record<string, keyof ImportedStudent> = {
  nombre: "name", name: "name",
  qrtexto: "qrtexto", qr: "qrtexto", id: "qrtexto", identificacion: "qrtexto", "identificación": "qrtexto",
  sede: "site", site: "site", location: "site",
  slot: "slot", grupo: "slot", hora: "slot",
  foto: "photo_url", photo: "photo_url", photo_url: "photo_url", "foto_url": "photo_url",
  "id card": "idcard_url", idcard: "idcard_url", id_card: "idcard_url", "id_card_url": "idcard_url", credencial: "idcard_url",
};

/** Parse an xlsx/xls/csv File into an array of student rows. */
export async function parseStudentSheet(file: File): Promise<ImportedStudent[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return json.map((raw) => {
    const out: ImportedStudent = { name: "", qrtexto: "", site: "", slot: "", photo_url: "", idcard_url: "" };
    for (const k of Object.keys(raw)) {
      const norm = k.trim().toLowerCase();
      const mapped = KEY_MAP[norm];
      if (mapped) out[mapped] = String(raw[k] ?? "").trim();
    }
    return out;
  }).filter((r) => r.name || r.qrtexto);
}
