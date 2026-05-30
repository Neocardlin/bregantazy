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
// 2. Корень сайта
// Нужен, чтобы картинки и JSON работали с разных страниц
// ========================================

const scriptElement = document.currentScript;
const siteRoot = scriptElement
  ? scriptElement.src.replace("script.js", "")
  : "./";


// ========================================
// 3. Альманах персонажей
// ========================================

const characterGrid = document.querySelector("#characterGrid");
const almanacSearch = document.querySelector("#almanacSearch");

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
// 4. Живой глаз в закладке
// При открытии страницы есть шанс моргнуть.
// Потом глаз иногда моргает сам.
// ========================================

(() => {
  const eyes = document.querySelectorAll(".bookmark-eye");

  if (eyes.length === 0) return;

  const eyeFrames = [
    `${siteRoot}images/ui/bookmark-eye-1.png`, // закрытый
    `${siteRoot}images/ui/bookmark-eye-2.png`,
    `${siteRoot}images/ui/bookmark-eye-3.png`,
    `${siteRoot}images/ui/bookmark-eye-4.png`, // открытый
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

    // Закрытие
    eye.src = eyeFrames[2];
    await sleep(70);

    eye.src = eyeFrames[1];
    await sleep(70);

    eye.src = eyeFrames[0];
    await sleep(120);

    // Открытие
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

  function tryBlinkOnPageOpen() {
    const blinkChance = 0.35;
    const shouldBlink = Math.random() < blinkChance;

    if (!shouldBlink) return;

    setTimeout(() => {
      eyes.forEach(blink);
    }, 450);
  }

  preloadFrames();

  eyes.forEach((eye) => {
    eye.src = openEye;
    scheduleRandomBlink(eye);
  });

  window.addEventListener("DOMContentLoaded", tryBlinkOnPageOpen);

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      tryBlinkOnPageOpen();
    }
  });
})();


// ========================================
// 5. Карточки
// ПК: клик открывает ссылку.
// Телефон: 1 тап раскрывает, 2 тап открывает ссылку.
// ========================================

(() => {
  const cards = document.querySelectorAll(".link-card");

  if (cards.length === 0) return;

  const isMobileLike = window.matchMedia(
    "(hover: none), (pointer: coarse), (max-width: 700px)"
  ).matches;

  function getCardUrl(card) {
    const isAnchorCard = card.tagName.toLowerCase() === "a";
    return isAnchorCard ? card.href : card.dataset.url;
  }

  function getCardTarget(card) {
    const isAnchorCard = card.tagName.toLowerCase() === "a";
    return isAnchorCard ? card.target : card.dataset.target;
  }

  function openCardUrl(card) {
    const url = getCardUrl(card);
    const target = getCardTarget(card) || "_self";

    if (!url) return;

    if (target === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  }

  function closeOtherCards(currentCard) {
    cards.forEach((card) => {
      if (card !== currentCard) {
        card.classList.remove("is-open");
        card.setAttribute("aria-expanded", "false");
      }
    });
  }

  cards.forEach((card) => {
    const hasUrl = Boolean(getCardUrl(card));

    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-expanded", "false");

    if (hasUrl) {
      card.setAttribute("role", "link");
    }

    card.addEventListener(
      "click",
      (event) => {
        const isAnchorCard = card.tagName.toLowerCase() === "a";
        const isOpen = card.classList.contains("is-open");

        // ПК:
        // Если карточка всё ещё <a>, браузер сам откроет ссылку.
        // Если карточка <article data-url>, открываем ссылку вручную.
        if (!isMobileLike) {
          if (!isAnchorCard && hasUrl) {
            openCardUrl(card);
          }

          return;
        }

        // Телефон:
        // Первый тап всегда только раскрывает карточку.
        if (!isOpen) {
          event.preventDefault();
          event.stopPropagation();

          closeOtherCards(card);

          card.classList.add("is-open");
          card.setAttribute("aria-expanded", "true");

          return;
        }

        // Телефон:
        // Второй тап открывает ссылку, если она есть.
        event.preventDefault();
        event.stopPropagation();

        if (hasUrl) {
          openCardUrl(card);
        }
      },
      true
    );

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();

      if (isMobileLike) {
        card.click();
      } else if (hasUrl) {
        openCardUrl(card);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!isMobileLike) return;
    if (event.target.closest(".link-card")) return;

    cards.forEach((card) => {
      card.classList.remove("is-open");
      card.setAttribute("aria-expanded", "false");
    });
  });
})();