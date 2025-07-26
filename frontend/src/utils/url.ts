export function isImage(url: string) {
    const pathname = new URL(url).pathname;
    const exts = ['.gif', '.webp', '.png', '.jpg', '.jpeg'];
    return exts.some((ext) => pathname.toLowerCase().endsWith(ext));
}
