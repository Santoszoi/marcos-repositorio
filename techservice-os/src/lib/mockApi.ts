import { KEY, parseOrders } from "./service";
export async function fetchOrders(signal?: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelado", "AbortError"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("Cancelado", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, 500);
    signal?.addEventListener("abort", abort, { once: true });
  });
  return parseOrders(localStorage.getItem(KEY));
}
