/**
 * Deduplica um array de objetos por `id`, mantendo somente a última
 * ocorrência de cada ID (last-write-wins via Map).
 *
 * Deve ser chamada SOMENTE na camada de dados (hooks/contextos).
 * Componentes de UI não devem realizar deduplicação.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
    return Array.from(new Map(items.map(item => [item.id, item])).values());
}
