import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PRACTICES_PATH = path.join(DATA_DIR, "pratiche.json");
const TARIFFE_PATH = path.join(DATA_DIR, "tariffe.json");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");

export type Practice = {
  created_at: string;
  via: string;
  civico: string;
  zona: string;
  sottofascia: number;
  mq: number;
  canone_min: number;
  canone_max: number;
};

export type Tariffa = { min: number; max: number };
export type TariffeDb = Record<string, Record<number, Tariffa>>;

export type AppConfig = {
  currentSchedaNumber: number;
};

const DEFAULT_TARIFFE: TariffeDb = {
  D49: {
    1: { min: 42.16, max: 75.73 },
    2: { min: 78.58, max: 142.87 },
    3: { min: 92.77, max: 176.44 },
  },
  B01: {
    1: { min: 34.56, max: 61.82 },
    2: { min: 61.82, max: 116.34 },
    3: { min: 116.34, max: 143.61 },
  },
  C05A: {
    1: { min: 40.63, max: 71.02 },
    2: { min: 71.02, max: 131.81 },
    3: { min: 131.81, max: 162.21 },
  }
};

const DEFAULT_CONFIG: AppConfig = {
  currentSchedaNumber: 1,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureJsonFile(pathName: string, initialData: any) {
  ensureDataDir();
  if (!fs.existsSync(pathName)) {
    fs.writeFileSync(pathName, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

export function listPractices(): Practice[] {
  ensureJsonFile(PRACTICES_PATH, []);
  return JSON.parse(fs.readFileSync(PRACTICES_PATH, "utf-8"));
}

export function savePractice(data: Omit<Practice, "created_at">) {
  const arr = listPractices();
  arr.unshift({ created_at: new Date().toISOString(), ...data });
  fs.writeFileSync(PRACTICES_PATH, JSON.stringify(arr, null, 2), "utf-8");
}

export function getTariffeDb(): TariffeDb {
  ensureJsonFile(TARIFFE_PATH, DEFAULT_TARIFFE);
  return JSON.parse(fs.readFileSync(TARIFFE_PATH, "utf-8"));
}

export function getTariffa(zona: string, sottofascia: number) {
  const db = getTariffeDb();
  return db[zona]?.[sottofascia] ?? null;
}

export function upsertZonaTariffe(
  zona: string,
  s1min: number, s1max: number,
  s2min: number, s2max: number,
  s3min: number, s3max: number
) {
  const db = getTariffeDb();
  db[zona] = {
    1: { min: s1min, max: s1max },
    2: { min: s2min, max: s2max },
    3: { min: s3min, max: s3max },
  };
  fs.writeFileSync(TARIFFE_PATH, JSON.stringify(db, null, 2), "utf-8");
  return db[zona];
}

export function getConfig(): AppConfig {
  ensureJsonFile(CONFIG_PATH, DEFAULT_CONFIG);
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

export function setConfig(config: AppConfig) {
  ensureJsonFile(CONFIG_PATH, DEFAULT_CONFIG);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  return config;
}

export function resetSchedaNumber(value = 1) {
  const cfg = getConfig();
  cfg.currentSchedaNumber = value;
  return setConfig(cfg);
}

export function consumeSchedaNumber() {
  const cfg = getConfig();
  const n = cfg.currentSchedaNumber || 1;
  cfg.currentSchedaNumber = n + 1;
  setConfig(cfg);
  return n;
}
