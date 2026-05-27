// ========================================
// Bregantazy.art
// Основной скрипт сайта
// ========================================


// ========================================
// 1. Подсветка активного раздела меню
// ========================================

const navLinks = document.querySelectorAll(".nav-link");
const path = window.location.pathname;

let currentPage = "home";

if (path.includes("/links")) {
  currentPage = "links";
} else if (path.includes("/thanks")) {
  currentPage = "thanks";
} else if (path.includes("/almanac")) {
  currentPage = "almanac";
}

navLinks.forEach((link) => {
  if (link.dataset.page === currentPage) {
    link.classList.add("active");
  }
});


// ========================================
// 2. Альманах персонажей
// Пока он может быть скрыт, но код готов
// ========================================

const characterGrid = document.querySelector("#characterGrid");
const almanacSearch = document.querySelector("#almanacSearch");

// Узнаём корень сайта через путь к самому script.js.
// Так будет работать и на GitHub Pages, и потом на bregantazy.art.
const scriptElement = document.currentScript;
const siteRoot = scriptElement
  ? scriptElement.src.replace("script.js", "")
  : "./";

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createCharacterCard(character) {
  const tags = character.tags
    .map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`)
    .join("");

  return `
    <article class="almanac-card">
      <div class="card-topline">
        <span>${escapeHTML(character.type)}</span>
        <span>${escapeHTML(character.project)}</span>
      </div>

      <h3>${escapeHTML(character.name)}</h3>

      <p>${escapeHTML(character.short)}</p>

      <div class="tags">
        ${tags}
      </div>
    </article>
  `;
}

function renderCharacters(characters) {
  if (!characterGrid) return;

  if (characters.length === 0) {
    characterGrid.innerHTML = `
      <p class="error-message">
        Ничего не найдено. Архив молчит, но он явно что-то скрывает.
      </p>
    `;
    return;
  }

  characterGrid.innerHTML = characters.map(createCharacterCard).join("");
}

async function loadAlmanac() {
  // Если на странице нет блока characterGrid, значит мы не в Альманахе.
  // Просто ничего не делаем.
  if (!characterGrid) return;

  try {
    const response = await fetch(`${siteRoot}data/characters.json`);

    if (!response.ok) {
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }

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