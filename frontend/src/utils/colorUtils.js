export function hslToHex(hsl) {
    const hslRegex = /hsl\(\s*(\d+) \s*([\d.]+)% \s*([\d.]+)%\)/i;
    const match = hsl.match(hslRegex);
    if (!match) return null;

    let [, h, s, l] = match.map(Number);
    s /= 100;
    l /= 100;

    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

    const r = f(0);
    const g = f(8);
    const b = f(4);

    return [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
