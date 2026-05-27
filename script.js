const navLinks = document.querySelectorAll(".nav-link");

let currentPage = "home";
const path = window.location.pathname;

if (path.startsWith("/almanac")) {
  currentPage = "almanac";
} else if (path.startsWith("/links")) {
  currentPage = "links";
} else if (path.startsWith("/thanks")) {
  currentPage = "thanks";
}

navLinks.forEach((link) => {
  if (link.dataset.page === currentPage) {
    link.classList.add("active");
  }
});

const characterGrid = document.querySelector("#characterGrid");
const almanacSearch = document.querySelector("#almanacSearch");

function createCharacterCard(character) {
  const tags = character.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  return `
    <article class="almanac-card">
      <div class="card-topline">
        <span>${character.type}</span>
        <span>${character.project}</span>
      </div>

      <h3>${character.name}</h3>

      <p>${character.short}</p>

      <div class="tags">
        ${tags}
      </div>
    </article>
  `;
}

function renderCharacters(characters) {
  characterGrid.innerHTML = characters.map(createCharacterCard).join("");
}

async function loadAlmanac() {
  if (!characterGrid) return;

  try {
    const response = await fetch("/data/characters.json");
    const characters = await response.json();

    renderCharacters(characters);

    if (almanacSearch) {
      almanacSearch.addEventListener("input", () => {
        const searchValue = almanacSearch.value.toLowerCase().trim();

        const filteredCharacters = characters.filter((character) => {
          const searchableText = `
            ${character.name}
            ${character.type}
            ${character.project}
            ${character.short}
            ${character.tags.join(" ")}
          `.toLowerCase();

          return searchableText.includes(searchValue);
        });

        renderCharacters(filteredCharacters);
      });
    }
  } catch (error) {
    characterGrid.innerHTML = `
      <p class="error-message">
        Не удалось загрузить записи Альманаха. Проверь файл data/characters.json.
      </p>
    `;

    console.error(error);
  }
}

loadAlmanac();