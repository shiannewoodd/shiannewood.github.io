const API_BASE = "https://pokeapi.co/api/v2/pokemon/";
const CACHE_PREFIX = "pokeCache_v1_";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7;

const input = document.getElementById("pokemonInput");
const findBtn = document.getElementById("findBtn");
const addBtn = document.getElementById("addBtn");

const status = document.getElementById("status");
const img = document.getElementById("pokemonImg");
const audio = document.getElementById("pokemonAudio");

const move1 = document.getElementById("move1");
const move2 = document.getElementById("move2");
const move3 = document.getElementById("move3");
const move4 = document.getElementById("move4");

const teamBody = document.getElementById("teamBody");
const teamSection = document.getElementById("teamSection");

let currentPokemon = null;
let team = [];

function setStatus(msg) {
  status.textContent = msg;
}

function cacheKey(id) {
  return CACHE_PREFIX + id;
}

function readCache(id) {
  const raw = localStorage.getItem(cacheKey(id));
  if (!raw) return null;

  const parsed = JSON.parse(raw);

  if (Date.now() - parsed.time > CACHE_TTL) return null;

  return parsed.data;
}

function writeCache(id, data) {
  localStorage.setItem(
    cacheKey(id),
    JSON.stringify({
      time: Date.now(),
      data: data
    })
  );
}

function forceHttps(url) {
  if (!url) return "";
  return url.replace("http:", "https:");
}

function getBestSprite(pokemon) {
  const sprite =
    pokemon.sprites.front_default ||
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.other.home.front_default ||
    pokemon.sprites.front_shiny ||
    "";

  return forceHttps(sprite);
}

function fillMoveDropdowns(moves) {
  const options = [`<option value="">Select move</option>`];

  moves.forEach(m => {
    const name = m.move.name;
    const label = name.replaceAll("-", " ");
    options.push(`<option value="${name}">${label}</option>`);
  });

  const html = options.join("");

  move1.innerHTML = html;
  move2.innerHTML = html;
  move3.innerHTML = html;
  move4.innerHTML = html;
}

function clearDisplay() {
  img.src = "";
  audio.pause();
  audio.removeAttribute("src");
  move1.innerHTML = "";
  move2.innerHTML = "";
  move3.innerHTML = "";
  move4.innerHTML = "";
}

async function fetchPokemon(query) {
  const res = await fetch(API_BASE + query);

  if (!res.ok) {
    throw new Error("Pokemon not found");
  }

  return res.json();
}

async function handleFind() {
  const query = input.value.trim().toLowerCase();

  if (!query) {
    setStatus("Enter a pokemon name or ID.");
    return;
  }

  setStatus("Loading...");
  clearDisplay();

  try {
    let pokemon = null;

    if (/^\d+$/.test(query)) {
      pokemon = readCache(query);
    }

    if (!pokemon) {
      pokemon = await fetchPokemon(query);

      if (pokemon.id) {
        writeCache(pokemon.id, pokemon);
      }
    }

    currentPokemon = pokemon;

    img.src = getBestSprite(pokemon);

    const cry = pokemon.cries?.latest || pokemon.cries?.legacy;

    if (cry) {
      audio.src = cry;
      audio.load();
    }

    fillMoveDropdowns(pokemon.moves);

    setStatus("Loaded " + pokemon.name);
  } catch (e) {
    setStatus("Pokemon not found.");
  }
}

function addToTeam() {
  if (!currentPokemon) {
    setStatus("Find a pokemon first.");
    return;
  }

  if (team.length >= 6) {
    setStatus("Team full.");
    return;
  }

  const selectedMoves = [
    move1.value,
    move2.value,
    move3.value,
    move4.value
  ].filter(Boolean);

  const entry = {
    name: currentPokemon.name,
    sprite: getBestSprite(currentPokemon),
    moves: selectedMoves
  };

  team.push(entry);

  renderTeam();

  setStatus(currentPokemon.name + " added to team.");
}

function renderTeam() {
  teamSection.classList.remove("hidden");

  teamBody.innerHTML = "";

  team.forEach(p => {
    const row = document.createElement("tr");

    const left = document.createElement("td");
    left.innerHTML = `<img class="teamSprite" src="${p.sprite}" width="64">`;

    const right = document.createElement("td");

    const list = p.moves
      .map(m => `<li>${m.replaceAll("-", " ")}</li>`)
      .join("");

    right.innerHTML = `<ul>${list}</ul>`;

    row.appendChild(left);
    row.appendChild(right);

    teamBody.appendChild(row);
  });
}

findBtn.addEventListener("click", handleFind);

input.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    handleFind();
  }
});

addBtn.addEventListener("click", addToTeam);