import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PokemonDetail from './PokemonDetail';
import './App.css';

function Home({ pokemons, search, setSearch, filtered, loading, sortMenuOpen, setSortMenuOpen, sortType, setSortType, page, setPage, totalPages, setTypeFilter, typeFilter }) {
  return (
    <div className="App">
      <h1>Pokédex (PokéAPI)</h1>
      <div className="filter-bar">
        <span className="filter-label">Ordenar por</span>
        <div className="sort-menu-container">
          <button className="sort-menu-btn" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            <span role="img" aria-label="pokeball" style={{marginRight: '8px'}}>⚪</span>
            {sortType === 'num-asc' && 'Número inferior'}
            {sortType === 'num-desc' && 'Número superior'}
            {sortType === 'az' && 'A-Z'}
            {sortType === 'za' && 'Z-A'}
            <span style={{marginLeft: '8px'}}>{sortMenuOpen ? '▲' : '▼'}</span>
          </button>
          {sortMenuOpen && (
            <div className="sort-menu-dropdown">
              <div className="sort-menu-item" onClick={() => {setSortType('num-asc');setSortMenuOpen(false);}}>Número inferior</div>
              <div className="sort-menu-item" onClick={() => {setSortType('num-desc');setSortMenuOpen(false);}}>Número superior</div>
              <div className="sort-menu-item" onClick={() => {setSortType('az');setSortMenuOpen(false);}}>A-Z</div>
              <div className="sort-menu-item" onClick={() => {setSortType('za');setSortMenuOpen(false);}}>Z-A</div>
            </div>
          )}
        </div>
      </div>
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{marginBottom: '20px', padding: '8px', fontSize: '16px'}}
      />
      {typeFilter && (
        <div style={{marginBottom: '12px'}}>
          <span>Filtrando por tipo: </span>
          <span className={`type-badge type-${typeFilter}`}>{typeFilter}</span>
          <button style={{marginLeft: '8px'}} onClick={() => setTypeFilter('')}>Quitar filtro</button>
        </div>
      )}
      {loading ? (
        <p>Cargando pokémon...</p>
      ) : (
        <>
          <div className="pokemon-grid">
            {filtered.map((poke) => (
              <Link key={poke.dex} to={`/pokemon/${poke.name}`} style={{textDecoration: 'none'}}>
                <div className="pokemon-card">
                  <span className="dex-number">#{poke.dex.toString().padStart(3, '0')}</span>
                  <img src={poke.image} alt={poke.name} className="poke-img" />
                  <h2>{poke.name}</h2>
                  <div className="type-list">
                    {poke.types.map((type, i) => (
                      <span key={i} className={`type-badge type-${type}`} onClick={e => {e.preventDefault(); setTypeFilter(type);}} style={{cursor: 'pointer'}}>{type}</span>
                    ))}
                  </div>
                  <p className="poke-weight">Peso: {poke.weight}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortType, setSortType] = useState('num-asc');
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    async function fetchAllPokemons() {
      setLoading(true);
      // Solo obtenemos la lista de nombres y urls
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1025`);
      const data = await res.json();
      setPokemons(data.results.map((poke, idx) => ({
        dex: idx + 1,
        name: poke.name,
        url: poke.url
      })));
      setLoading(false);
    }
    fetchAllPokemons();
  }, []);

  useEffect(() => {
    async function fetchPageDetails() {
      setLoading(true);
      let result = pokemons.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      switch (sortType) {
        case 'num-asc':
          result = result.sort((a, b) => a.dex - b.dex);
          break;
        case 'num-desc':
          result = result.sort((a, b) => b.dex - a.dex);
          break;
        case 'az':
          result = result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'za':
          result = result.sort((a, b) => b.name.localeCompare(a.name));
          break;
        default:
          break;
      }
      setTotalPages(Math.ceil(result.length / pageSize));
      // Si hay filtro de tipo, buscar solo los pokémon de ese tipo
      let pagePokemons = result.slice((page - 1) * pageSize, page * pageSize);
      if (typeFilter) {
        // Buscar solo los pokémon de ese tipo en la API
        const resType = await fetch(`https://pokeapi.co/api/v2/type/${typeFilter}`);
        const typeData = await resType.json();
        // typeData.pokemon es un array con los pokémon de ese tipo
        const typeNames = typeData.pokemon.map(p => p.pokemon.name);
        pagePokemons = pagePokemons.filter(p => typeNames.includes(p.name));
      }
      // Pedimos los detalles SOLO de estos
      const details = await Promise.all(
        pagePokemons.map(async (poke) => {
          const resDetails = await fetch(poke.url);
          const detailsData = await resDetails.json();
          const types = detailsData.types.map(t => t.type.name);
          return {
            dex: poke.dex,
            name: detailsData.name,
            types,
            image: detailsData.sprites.front_default,
            weight: detailsData.weight,
          };
        })
      );
      setFiltered(details);
      setLoading(false);
    }
    if (pokemons.length > 0) {
      fetchPageDetails();
    }
  }, [search, pokemons, sortType, page, typeFilter]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Home
            pokemons={pokemons}
            search={search}
            setSearch={setSearch}
            filtered={filtered}
            loading={loading}
            sortMenuOpen={sortMenuOpen}
            setSortMenuOpen={setSortMenuOpen}
            sortType={sortType}
            setSortType={setSortType}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            setTypeFilter={setTypeFilter}
            typeFilter={typeFilter}
          />
        } />
        <Route path="/pokemon/:name" element={<PokemonDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
