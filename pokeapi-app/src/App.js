import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PokemonDetail from './PokemonDetail';
import './App.css';

function Home({ pokemons, search, setSearch, filtered, loading, sortMenuOpen, setSortMenuOpen, sortType, setSortType, page, setPage, totalPages }) {
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
                      <span key={i} className={`type-badge type-${type}`}>{type}</span>
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

  useEffect(() => {
    async function fetchAllPokemons() {
      setLoading(true);
      const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
      const data = await res.json();
      const details = await Promise.all(
        data.results.map(async (poke, idx) => {
          const resDetails = await fetch(poke.url);
          const detailsData = await resDetails.json();
          const types = detailsData.types.map(t => t.type.name);
          return {
            dex: idx + 1,
            name: detailsData.name,
            types,
            image: detailsData.sprites.front_default,
            weight: detailsData.weight,
          };
        })
      );
      setPokemons(details);
      setLoading(false);
    }
    fetchAllPokemons();
  }, []);

  useEffect(() => {
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
    setFiltered(result.slice((page - 1) * pageSize, page * pageSize));
  }, [search, pokemons, sortType, page]);

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
          />
        } />
        <Route path="/pokemon/:name" element={<PokemonDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
