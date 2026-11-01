// Client API Marketing. Aman dipakai dari Client Component/hook.

export class MarketingApiError extends Error {
    constructor(payload, status) {
        super(
            payload?.message ??
                "Terjadi kesalahan saat memproses data Marketing.",
        );
        this.name = "MarketingApiError";
        this.status = status;
        this.code = payload?.code ?? "REQUEST_FAILED";
        this.fieldErrors = payload?.fieldErrors ?? {};
    }
}

async function requestJson(path, { method = "GET", body } = {}) {
    let response;

    try {
        response = await fetch(path, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            credentials: "same-origin",
            cache: "no-store",
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new MarketingApiError(
            {
                code: "NETWORK_ERROR",
                message:
                    "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
            },
            0,
        );
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new MarketingApiError(payload, response.status);
    return payload?.data ?? payload;
}

function createResourceApi(basePath) {
    return {
        list: () => requestJson(basePath),
        create: (payload) =>
            requestJson(basePath, { method: "POST", body: payload }),
        update: (id, payload) =>
            requestJson(`${basePath}/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: payload,
            }),
        remove: (id) =>
            requestJson(`${basePath}/${encodeURIComponent(id)}`, {
                method: "DELETE",
            }),
    };
}

export const packageCatalogApi = createResourceApi("/api/marketing/packages");

export const promotionApi = {
    ...createResourceApi("/api/marketing/promotions"),
    createBatch: (items) =>
        requestJson("/api/marketing/promotions/batch", {
            method: "POST",
            body: { items },
        }),
};
export const articleApi = {
    ...createResourceApi("/api/marketing/articles"),
    preview: (content) =>
        requestJson("/api/marketing/articles/preview", {
            method: "POST",
            body: { content },
        }),
};

export const leadApi = {
    ...createResourceApi("/api/marketing/leads"),
    addActivity: (id, note) =>
        requestJson(
            `/api/marketing/leads/${encodeURIComponent(id)}/activities`,
            {
                method: "POST",
                body: { note },
            },
        ),
};

export async function submitPublicLead(payload) {
    return requestJson("/api/leads", { method: "POST", body: payload });
}
