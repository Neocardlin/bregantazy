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
// ========================================
// Случайное моргание глаза в закладке
// ========================================

(() => {
  const bookmarkEyes = document.querySelectorAll(".bookmark-eye");

  if (bookmarkEyes.length === 0) return;

  const scriptElement = document.currentScript;
  const siteRoot = scriptElement
    ? scriptElement.src.replace("script.js", "")
    : "/";

  const eyeFrames = [
    `${siteRoot}images/ui/bookmark-eye-1.png`,
    `${siteRoot}images/ui/bookmark-eye-2.png`,
    `${siteRoot}images/ui/bookmark-eye-3.png`,
    `${siteRoot}images/ui/bookmark-eye-4.png`,
  ];

  const openEye = eyeFrames[3];

  function preloadFrames() {
    eyeFrames.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function blink(eye) {
    if (eye.dataset.blinking === "true") return;

    eye.dataset.blinking = "true";

    // закрытие
    eye.src = eyeFrames[2];
    await sleep(70);

    eye.src = eyeFrames[1];
    await sleep(70);

    eye.src = eyeFrames[0];
    await sleep(120);

    // открытие
    eye.src = eyeFrames[1];
    await sleep(65);

    eye.src = eyeFrames[2];
    await sleep(65);

    eye.src = eyeFrames[3];
    await sleep(90);

    eye.dataset.blinking = "false";
  }

  function scheduleRandomBlink(eye) {
    const minDelay = 4500;
    const maxDelay = 12000;

    const delay =
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    setTimeout(async () => {
      await blink(eye);
      scheduleRandomBlink(eye);
    }, delay);
  }

  preloadFrames();

  bookmarkEyes.forEach((eye) => {
    eye.src = openEye;
    scheduleRandomBlink(eye);
  });
})();
// ========================================
// Шанс моргания глаза при открытии страницы / раздела
// ========================================

(() => {
  const blinkChance = 0.35; // 35% шанс моргания при каждом открытии страницы
  const frameDelay = 70;
  const startDelay = 450;

  const frames = [
    "/images/ui/bookmark-eye-4.png", // открытый
    "/images/ui/bookmark-eye-3.png",
    "/images/ui/bookmark-eye-2.png",
    "/images/ui/bookmark-eye-1.png", // закрытый
    "/images/ui/bookmark-eye-2.png",
    "/images/ui/bookmark-eye-3.png",
    "/images/ui/bookmark-eye-4.png"  // снова открытый
  ];

  function preloadFrames() {
    frames.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }

  function playBlink(eye) {
    let frameIndex = 0;

    const blinkInterval = setInterval(() => {
      eye.src = frames[frameIndex];
      frameIndex += 1;

      if (frameIndex >= frames.length) {
        clearInterval(blinkInterval);
        eye.src = frames[0];
      }
    }, frameDelay);
  }

  function tryBlinkOnPageOpen() {
    const eyes = document.querySelectorAll(".bookmark-eye");

    if (eyes.length === 0) return;

    const shouldBlink = Math.random() < blinkChance;

    if (!shouldBlink) return;

    setTimeout(() => {
      eyes.forEach(playBlink);
    }, startDelay);
  }

  preloadFrames();

  // Обычное открытие страницы
  window.addEventListener("DOMContentLoaded", tryBlinkOnPageOpen);

  // Возврат назад/вперёд в браузере, когда страница берётся из кэша
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      tryBlinkOnPageOpen();
    }
  });
})();
// ========================================
// Мобильные карточки:
// 1 тап — раскрыть карточку
// 2 тап — открыть ссылку
// ========================================

(() => {
  const cards = document.querySelectorAll(".link-card");

  const isMobileLike = window.matchMedia(
    "(hover: none), (pointer: coarse), (max-width: 700px)"
  ).matches;

  if (!isMobileLike || cards.length === 0) return;

  function closeOtherCards(currentCard) {
    cards.forEach((card) => {
      if (card !== currentCard) {
        card.classList.remove("is-open");
        card.setAttribute("aria-expanded", "false");
      }
    });
  }

  cards.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-expanded", "false");

    card.addEventListener(
      "click",
      (event) => {
        const isOpen = card.classList.contains("is-open");
        const isAnchorCard = card.tagName.toLowerCase() === "a";

        const url = isAnchorCard ? card.href : card.dataset.url;
        const target = isAnchorCard ? card.target : card.dataset.target;

        // Первый тап: ВСЕГДА запрещаем переход и только раскрываем карточку.
        if (!isOpen) {
          event.preventDefault();
          event.stopPropagation();

          closeOtherCards(card);

          card.classList.add("is-open");
          card.setAttribute("aria-expanded", "true");

          return;
        }

        // Второй тап: если ссылки нет, просто ничего не открываем.
        if (!url) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        // Второй тап: открываем ссылку сами.
        event.preventDefault();
        event.stopPropagation();

        if (target === "_blank") {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = url;
        }
      },
      true
    );
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".link-card")) return;

    cards.forEach((card) => {
      card.classList.remove("is-open");
      card.setAttribute("aria-expanded", "false");
    });
  });
})();