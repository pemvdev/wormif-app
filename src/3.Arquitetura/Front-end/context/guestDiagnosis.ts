import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { saveGuestImage } from './guestImages';

export const GUEST_DIAGNOSIS_LIMIT = 3;
const GUEST_STORAGE_KEY = 'wormif_guest_pending_v1';

export interface PendingGuestDiagnosis {
  id: string;
  createdAt: string;
  result: DiagnosticoResponseDTO;
  localizacao?: {
    lat: number;
    lng: number;
    label: string;
  };
}

interface GuestDiagnosisState {
  usedCount: number;
  pending: PendingGuestDiagnosis[];
}

function loadGuestState(): GuestDiagnosisState {
  try {
    const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return { usedCount: 0, pending: [] };
    const parsed = JSON.parse(raw) as GuestDiagnosisState;
    return {
      usedCount: parsed.usedCount ?? 0,
      pending: parsed.pending ?? []
    };
  } catch {
    return { usedCount: 0, pending: [] };
  }
}

function saveGuestState(state: GuestDiagnosisState): void {
  sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(state));
}

export function getGuestDiagnosisState(): GuestDiagnosisState {
  return loadGuestState();
}

export function canGuestAnalyze(): boolean {
  return loadGuestState().usedCount < GUEST_DIAGNOSIS_LIMIT;
}

export function getGuestRemainingAnalyses(): number {
  return Math.max(0, GUEST_DIAGNOSIS_LIMIT - loadGuestState().usedCount);
}

export async function addPendingGuestDiagnosis(
  result: DiagnosticoResponseDTO,
  localizacao?: PendingGuestDiagnosis['localizacao'],
  imagem?: UploadImagemDTO
): Promise<boolean> {
  const id = crypto.randomUUID();
  let imageSaved = true;
  if (imagem) {
    try { await saveGuestImage(id, imagem); } catch { imageSaved = false; }
  }
  const state = loadGuestState();
  state.usedCount += 1;
  state.pending.push({
    id,
    createdAt: new Date().toISOString(),
    result,
    localizacao
  });
  saveGuestState(state);
  return imageSaved;
}

export function clearPendingGuestDiagnoses(): PendingGuestDiagnosis[] {
  const state = loadGuestState();
  const pending = [...state.pending];
  state.pending = [];
  saveGuestState(state);
  return pending;
}

export function requeuePendingGuestDiagnosis(item: PendingGuestDiagnosis): void {
  const state = loadGuestState();
  state.pending.push(item);
  saveGuestState(state);
}
