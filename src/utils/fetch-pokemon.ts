const PAGE_SIZE = 20;

export const fetchPokemons = async ({ pageParam = 0 }) => {
  const offset = pageParam * PAGE_SIZE;
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${PAGE_SIZE}`
  );
  return res.json();
};
