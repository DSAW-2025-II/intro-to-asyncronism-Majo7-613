import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PokemonDetail.css';

function Weaknesses({ types }) {
  const [weaknesses, setWeaknesses] = useState([]);

  useEffect(() => {
    async function fetchWeaknesses() {
      let allWeak = [];
      for (let type of types) {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        const typeData = await res.json();
        const weak = typeData.damage_relations.double_damage_from.map(t => t.name);
        allWeak = [...allWeak, ...weak];
      }
      setWeaknesses([...new Set(allWeak)]);
    }
    fetchWeaknesses();
  }, [types]);

  return (
    <div className="weakness-list">
      {weaknesses.map((w, i) => (
        <span key={i} className={`type-badge type-${w}`}>{w}</span>
      ))}
    </div>
  );
}

function PokemonDetail() {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const [species, setSpecies] = useState(null);
  const [evolutions, setEvolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Info básica
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
      const pokeData = await res.json();
      setData(pokeData);
      // Info de especie
      const resSpecies = await fetch(pokeData.species.url);
      const speciesData = await resSpecies.json();
      setSpecies(speciesData);
      // Evoluciones
      const resEvo = await fetch(speciesData.evolution_chain.url);
      const evoData = await resEvo.json();
      // Extraer cadena de evoluciones
      let chain = [];
      let evo = evoData.chain;
      do {
        chain.push({
          name: evo.species.name,
          url: evo.species.url,
        });
        evo = evo.evolves_to[0];
      } while (evo && evo.hasOwnProperty('evolves_to'));
      setEvolutions(chain);
      setLoading(false);
    }
    fetchData();
  }, [name]);

  if (loading || !data || !species) return <div className="App"><p>Cargando...</p></div>;

  // Obtener género
  const gender = species.gender_rate === -1 ? 'Desconocido' : species.gender_rate === 0 ? '♂' : species.gender_rate === 8 ? '♀' : '♂/♀';
  // Categoría
  const category = species.genera.find(g => g.language.name === 'es')?.genus || species.genera[0]?.genus || '';
  // Versión amigable en español
  const versionNamesES = {
    'red': 'Rojo',
    'blue': 'Azul',
    'yellow': 'Amarillo',
    'gold': 'Oro',
    'silver': 'Plata',
    'crystal': 'Cristal',
    'ruby': 'Rubí',
    'sapphire': 'Zafiro',
    'emerald': 'Esmeralda',
    'firered': 'Rojo Fuego',
    'leafgreen': 'Verde Hoja',
    'diamond': 'Diamante',
    'pearl': 'Perla',
    'platinum': 'Platino',
    'heartgold': 'Oro HeartGold',
    'soulsilver': 'Plata SoulSilver',
    'black': 'Negro',
    'white': 'Blanco',
    'black-2': 'Negro 2',
    'white-2': 'Blanco 2',
    'x': 'X',
    'y': 'Y',
    'omega-ruby': 'Rubí Omega',
    'alpha-sapphire': 'Zafiro Alfa',
    'sun': 'Sol',
    'moon': 'Luna',
    'ultra-sun': 'Ultrasol',
    'ultra-moon': 'Ultraluna',
    'lets-go-pikachu': 'Let’s Go Pikachu',
    'lets-go-eevee': 'Let’s Go Eevee',
    'sword': 'Espada',
    'shield': 'Escudo',
    'scarlet': 'Escarlata',
    'violet': 'Púrpura',
  };
  const versions = data.game_indices.map(g => g.version.name).slice(0, 2);
  // Puntos base
  const stats = data.stats;

  return (
    <div className="pokemon-detail">
      <Link to="/" className="back-link">← Ir a la Pokédex</Link>
      <h1>{data.name} N.º {data.id.toString().padStart(4, '0')}</h1>
      <div className="detail-main">
        <img src={data.sprites.other['official-artwork'].front_default || data.sprites.front_default} alt={data.name} className="detail-img" />
        <div className="detail-info">
          <p>{species.flavor_text_entries.find(e => e.language.name === 'es')?.flavor_text || ''}</p>
          <div className="detail-box">
            <div><strong>Altura:</strong> {data.height / 10} m</div>
            <div><strong>Peso:</strong> {data.weight / 10} kg</div>
            <div><strong>Categoría:</strong> {category}</div>
            <div><strong>Género:</strong> {gender}</div>
            <div><strong>Habilidades:</strong> {data.abilities.map((a, i) => (
              <span key={i} className="ability-badge">{a.ability.name}{a.is_hidden ? ' (Oculta)' : ''}</span>
            ))}</div>
            <div><strong>Tipo:</strong> {data.types.map(t => <span key={t.type.name} className={`type-badge type-${t.type.name}`}>{t.type.name}</span>)}</div>
          </div>
          <div className="weakness-box">
            <strong>Debilidad:</strong>
            {data.types.length > 0 && (
              <Weaknesses types={data.types.map(t => t.type.name)} />
            )}
          </div>
          <div className="version-box">
            <strong>Versiones:</strong> {versions.map((v, i) => (
              <span key={i} className="version-badge">{versionNamesES[v] || v}</span>
            ))}
          </div>
          <div className="stats-box">
            <strong>Puntos de base</strong>
            <div className="stats-list">
              {stats.map((s, i) => (
                <div key={i} className="stat-item">
                  <span className="stat-label">{s.stat.name.toUpperCase()}</span>
                  <span className="stat-bar" style={{width: `${s.base_stat/2}%`}}>{s.base_stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="evolutions">
        <h2>Evoluciones</h2>
        <div className="evo-list">
          {evolutions.map((evo, idx) => (
            <Link key={idx} to={`/pokemon/${evo.name}`} style={{textDecoration: 'none'}}>
              <div className="evo-card">
                <span>{evo.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PokemonDetail;
