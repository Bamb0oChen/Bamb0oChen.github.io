export async function fetchSiteConfig(url) {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}
