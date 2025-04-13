// File: dev/src/frontend/my-app/src/services/api.ts

export interface Event {
    id: number;
    name: string;
    date: string;
    location: string;
    status: string;
}

export async function fetchEvents(baseUrl: string, page: number = 1, limit: number = 10): Promise<Event[]> {
    const response = await fetch(`${baseUrl}/events?page=${page}&limit=${limit}`);
    if (!response.ok) {
        throw new Error("Erreur lors de la récupération des événements");
    }
    const data = await response.json();
    return data.data || data;
}
