"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { AdCampaign, CampaignStatus } from "@/types/analytics";
import { fetchCampaignsData } from "@/lib/mockApi";
import { restoreStatuses } from "@/lib/analytics";
const KEY = "@adanalytics:statuses:v1";
const Context = createContext<{
  campaigns: AdCampaign[];
  loading: boolean;
  error: string;
  message: string;
  refresh: () => void;
  changeStatus: (id: string, status: CampaignStatus) => void;
} | null>(null);
export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchCampaignsData(controller.signal)
      .then((data) => {
        let saved = {};
        try {
          saved = restoreStatuses(localStorage.getItem(KEY));
        } catch {
          setMessage(
            "O navegador bloqueou o armazenamento. Alterações não serão mantidas.",
          );
        }
        setCampaigns(
          data.map((c) => ({
            ...c,
            status: (saved as Record<string, CampaignStatus>)[c.id] ?? c.status,
          })),
        );
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError("Não foi possível carregar as campanhas. Tente novamente.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [revision]);
  const changeStatus = useCallback(
    (id: string, status: CampaignStatus) => {
      const next = campaigns.map((c) =>
        c.id === id && c.status !== "Concluída" && status !== "Concluída"
          ? { ...c, status }
          : c,
      );
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify(
            Object.fromEntries(
              next
                .filter((c) => c.status !== "Concluída")
                .map((c) => [c.id, c.status]),
            ),
          ),
        );
      } catch {
        setMessage(
          "Alteração aplicada nesta sessão. Não foi possível salvar no navegador.",
        );
      }
      setCampaigns(next);
    },
    [campaigns],
  );
  return (
    <Context.Provider
      value={{
        campaigns,
        loading,
        error,
        message,
        refresh: () => setRevision((r) => r + 1),
        changeStatus,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCampaigns() {
  const c = useContext(Context);
  if (!c) throw new Error("CampaignProvider ausente");
  return c;
}
