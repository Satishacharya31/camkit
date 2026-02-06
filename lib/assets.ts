interface Asset {
    name: string;
    url: string;
}

/**
 * Replaces relative asset paths (e.g., "assets/image.png") with actual URLs.
 * Works for HTML, CSS, and JS code.
 * @param code The source code string
 * @param assets List of available assets
 * @returns Code with replaced URLs
 */
export function resolveRelativeAssets(code: string, assets: Asset[]): string {
    let resolvedCode = code;

    // Sort assets by length (longest first) to avoid partial replacements if names overlap
    const sortedAssets = [...assets].sort((a, b) => b.name.length - a.name.length);

    sortedAssets.forEach((asset) => {
        // Escape special regex characters in the asset name
        const escapedName = asset.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Pattern variants to catch:
        // 1. assets/filename.ext
        // 2. /assets/filename.ext
        // 3. ./assets/filename.ext
        const pattern = new RegExp(`(\\.?\\/?assets\\/${escapedName})`, 'g');

        resolvedCode = resolvedCode.replace(pattern, asset.url);
    });

    return resolvedCode;
}
