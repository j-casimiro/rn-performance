// Helper to extract ID from URL
export function getPokemonId(url: string) {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? match[1] : null;
}

// Fetch additional info for a pokemon (basic: id, sprite)
export async function fetchPokemonDetails(nameOrId: string) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return {
      id: data.id,
      sprite: data.sprites.front_default,
      types: data.types.map((t: any) => t.type.name),
    };
  } catch {
    return { id: null, sprite: null, types: [] };
  }
}
