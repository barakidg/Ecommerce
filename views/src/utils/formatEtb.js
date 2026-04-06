export function formatEtb(amount) {
    const n = Number(amount ?? 0);
    if (Number.isNaN(n)) return "0 ETB";
    return `${n.toLocaleString()} ETB`;
}
