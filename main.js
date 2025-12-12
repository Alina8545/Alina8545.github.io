// ==== CONFIG ====
const TMDB_API_KEY = "b0d04d5e9120e99b0ad4215f45c3a6ac"; // <- put your key here
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const MUSICAL_GENRE_ID = 10402;

let featuredMovies = [];
let browseMovies = [];
let watchlist = [];

const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".nav__link");

const heroSearchForm = document.getElementById("hero-search-form");
const heroSearchInput = document.getElementById("hero-search-input");
const featuredGrid = document.getElementById("featured-grid");
const featuredStatusText = document.getElementById("featured-status-text");

// Browse section
const browseSearchForm = document.getElementById("browse-search-form");
const browseSearchInput = document.getElementById("browse-search-input");
const browseGrid = document.getElementById("browse-grid");
const browseStatusText = document.getElementById("browse-status-text");
const filterDecadeSelect = document.getElementById("filter-decade");
const filterMinRatingSelect = document.getElementById("filter-min-rating");
const filterSortSelect = document.getElementById("filter-sort");
const applyFiltersBtn = document.getElementById("apply-filters-btn");

const watchlistGrid = document.getElementById("watchlist-grid");
const watchlistEmptyText = document.getElementById("watchlist-empty-text");
const sortWatchlistRatingBtn = document.getElementById("sort-watchlist-rating-btn");
const clearWatchlistBtn = document.getElementById("clear-watchlist-btn");

const movieModal = document.getElementById("movie-modal");
const modalContent = document.getElementById("modal-content");
const modalDismissElems = document.querySelectorAll("[data-modal-dismiss]");


function formatYear(dateStr) {
    if (!dateStr) return "Unknown year";
    return new Date(dateStr).getFullYear();
}

function truncate(text, maxLen = 110) {
    if (!text) return "";
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 1) + "…";
}

function saveWatchlist() {
    try {
        localStorage.setItem("musicalExplorerWatchlist", JSON.stringify(watchlist));
    } catch (e) {
        console.error("Failed to save watchlist:", e);
    }
}

function loadWatchlist() {
    try {
        const raw = localStorage.getItem("musicalExplorerWatchlist");
        watchlist = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Failed to load watchlist:", e);
        watchlist = [];
    }
}

function isInWatchlist(movieId) {
    return watchlist.some(m => m.id === movieId);
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
}

async function fetchFeaturedMusicals() {
    featuredStatusText.textContent = "Loading featured musical films...";
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${MUSICAL_GENRE_ID}&sort_by=popularity.desc&page=1`;
    try {
        const data = await fetchJson(url);
        featuredMovies = (data.results || []).slice(0, 12);
        renderMovieGrid(featuredMovies, featuredGrid, "No featured musicals found.");
        featuredStatusText.textContent = `Showing ${featuredMovies.length} popular musical films.`;
    } catch (err) {
        console.error(err);
        featuredStatusText.textContent = "Error loading featured films. Check API key or network.";
    }
}

async function searchMusicals(query) {
    browseStatusText.textContent = `Searching for "${query}"...`;
    const encoded = encodeURIComponent(query);
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encoded}&include_adult=false&page=1`;
    try {
        const data = await fetchJson(url);
        // Filter results to those that at least include Music genre if possible
        browseMovies = (data.results || []).filter(m =>
            m.genre_ids && m.genre_ids.includes(MUSICAL_GENRE_ID)
        );
        if (browseMovies.length === 0) {
            browseMovies = data.results || [];
        }
        renderMovieGrid(browseMovies, browseGrid, "No results found for that search.");
        browseStatusText.textContent = `Found ${browseMovies.length} result(s).`;
    } catch (err) {
        console.error(err);
        browseStatusText.textContent = "Error searching. Check API key or network.";
    }
}

async function fetchFilteredMusicals() {
    let decade = filterDecadeSelect.value;
    let minRating = filterMinRatingSelect.value;
    let sortBy = filterSortSelect.value || "popularity.desc";

    browseStatusText.textContent = "Loading filtered results...";
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${MUSICAL_GENRE_ID}&sort_by=${sortBy}&page=1`;

    if (decade) {
        const startYear = Number(decade);
        const endYear = startYear + 9;
        url += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
    }

    if (minRating) {
        url += `&vote_average.gte=${minRating}&vote_count.gte=50`;
    }

    try {
        const data = await fetchJson(url);
        browseMovies = data.results || [];
        renderMovieGrid(browseMovies, browseGrid, "No films match these filters.");
        browseStatusText.textContent = `Showing ${browseMovies.length} filtered result(s).`;
    } catch (err) {
        console.error(err);
        browseStatusText.textContent = "Error fetching filtered results.";
    }
}

function renderMovieGrid(movies, container, emptyMessage) {
    container.innerHTML = "";
    if (!movies || movies.length === 0) {
        const msg = document.createElement("p");
        msg.className = "muted-text";
        msg.textContent = emptyMessage || "No items to display.";
        container.appendChild(msg);
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement("article");
        card.className = "card";

        const posterWrapper = document.createElement("div");
        posterWrapper.className = "card__poster-wrapper";

        const img = document.createElement("img");
        img.className = "card__poster-img";
        if (movie.poster_path) {
            img.src = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
            img.alt = `${movie.title} poster`;
        } else {
            img.alt = `${movie.title} poster not available`;
        }

        posterWrapper.appendChild(img);

        const ratingPill = document.createElement("div");
        ratingPill.className = "card__rating-pill";
        const starSpan = document.createElement("span");
        starSpan.className = "card__rating-star";
        starSpan.textContent = "★";
        const ratingSpan = document.createElement("span");
        ratingSpan.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : "–";
        ratingPill.appendChild(starSpan);
        ratingPill.appendChild(ratingSpan);
        posterWrapper.appendChild(ratingPill);

        const body = document.createElement("div");
        body.className = "card__body";

        const title = document.createElement("h3");
        title.className = "card__title";
        title.textContent = movie.title;

        const meta = document.createElement("div");
        meta.className = "card__meta";
        const yearSpan = document.createElement("span");
        yearSpan.textContent = formatYear(movie.release_date);
        const langSpan = document.createElement("span");
        langSpan.textContent = movie.original_language ? movie.original_language.toUpperCase() : "";
        meta.appendChild(yearSpan);
        meta.appendChild(langSpan);

        const overview = document.createElement("p");
        overview.className = "card__overview";
        overview.textContent = truncate(movie.overview || "", 100);

        const actions = document.createElement("div");
        actions.className = "card__actions";

        const detailsBtn = document.createElement("button");
        detailsBtn.className = "btn btn--ghost card__btn card__btn--secondary";
        detailsBtn.type = "button";
        detailsBtn.textContent = "Details";

        const watchlistBtn = document.createElement("button");
        watchlistBtn.className = "btn btn--primary card__btn";
        watchlistBtn.type = "button";
        watchlistBtn.textContent = isInWatchlist(movie.id) ? "In watchlist" : "Add to watchlist";

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(overview);
        body.appendChild(actions);
        actions.appendChild(detailsBtn);
        actions.appendChild(watchlistBtn);

        card.appendChild(posterWrapper);
        card.appendChild(body);
        container.appendChild(card);

        detailsBtn.addEventListener("click", (evt) => {
            evt.stopPropagation();
            openMovieModal(movie);
        });

        watchlistBtn.addEventListener("click", (evt) => {
            evt.stopPropagation();
            toggleWatchlist(movie, watchlistBtn);
        });

        card.addEventListener("click", () => {
            openMovieModal(movie);
        });
    });
}

function renderWatchlist() {
    watchlistGrid.innerHTML = "";

    if (!watchlist || watchlist.length === 0) {
        watchlistEmptyText.style.display = "block";
        return;
    }

    watchlistEmptyText.style.display = "none";

    watchlist.forEach(movie => {
        const card = document.createElement("article");
        card.className = "card";

        const posterWrapper = document.createElement("div");
        posterWrapper.className = "card__poster-wrapper";

        const img = document.createElement("img");
        img.className = "card__poster-img";
        if (movie.poster_path) {
            img.src = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
            img.alt = `${movie.title} poster`;
        } else {
            img.alt = `${movie.title} poster not available`;
        }
        posterWrapper.appendChild(img);

        const ratingPill = document.createElement("div");
        ratingPill.className = "card__rating-pill";
        const starSpan = document.createElement("span");
        starSpan.className = "card__rating-star";
        starSpan.textContent = "★";
        const ratingSpan = document.createElement("span");
        ratingSpan.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : "–";
        ratingPill.appendChild(starSpan);
        ratingPill.appendChild(ratingSpan);
        posterWrapper.appendChild(ratingPill);

        const body = document.createElement("div");
        body.className = "card__body";

        const title = document.createElement("h3");
        title.className = "card__title";
        title.textContent = movie.title;

        const meta = document.createElement("div");
        meta.className = "card__meta";
        const yearSpan = document.createElement("span");
        yearSpan.textContent = formatYear(movie.release_date);
        const langSpan = document.createElement("span");
        langSpan.textContent = movie.original_language ? movie.original_language.toUpperCase() : "";
        meta.appendChild(yearSpan);
        meta.appendChild(langSpan);

        const overview = document.createElement("p");
        overview.className = "card__overview";
        overview.textContent = truncate(movie.overview || "", 90);

        const actions = document.createElement("div");
        actions.className = "card__actions";

        const detailsBtn = document.createElement("button");
        detailsBtn.className = "btn btn--ghost card__btn card__btn--secondary";
        detailsBtn.type = "button";
        detailsBtn.textContent = "Details";

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn--danger card__btn";
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";

        actions.appendChild(detailsBtn);
        actions.appendChild(removeBtn);

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(overview);
        body.appendChild(actions);

        card.appendChild(posterWrapper);
        card.appendChild(body);
        watchlistGrid.appendChild(card);

        detailsBtn.addEventListener("click", (evt) => {
            evt.stopPropagation();
            openMovieModal(movie);
        });

        removeBtn.addEventListener("click", (evt) => {
            evt.stopPropagation();
            removeFromWatchlist(movie.id);
        });

        card.addEventListener("click", () => {
            openMovieModal(movie);
        });
    });
}


function toggleWatchlist(movie, buttonElem) {
    if (isInWatchlist(movie.id)) {
        // Remove
        watchlist = watchlist.filter(m => m.id !== movie.id);
        if (buttonElem) buttonElem.textContent = "Add to watchlist";
    } else {
        watchlist.push(movie);
        if (buttonElem) buttonElem.textContent = "In watchlist";
    }
    saveWatchlist();
    renderWatchlist();
}

function removeFromWatchlist(movieId) {
    watchlist = watchlist.filter(m => m.id !== movieId);
    saveWatchlist();
    renderWatchlist();
}

function sortWatchlistByRatingDesc() {
    watchlist.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    saveWatchlist();
    renderWatchlist();
}


function openMovieModal(movie) {
    // Build modal content
    modalContent.innerHTML = "";

    const posterDiv = document.createElement("div");
    posterDiv.className = "modal__poster";
    const img = document.createElement("img");
    img.src = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : "";
    img.alt = movie.title + " poster";
    posterDiv.appendChild(img);

    const detailsDiv = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "modal__details-title";
    title.textContent = movie.title;

    const meta = document.createElement("div");
    meta.className = "modal__details-meta";
    const year = formatYear(movie.release_date);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "–";
    meta.textContent = `${year} • Rating: ${rating}/10`;

    const overview = document.createElement("p");
    overview.className = "modal__overview";
    overview.textContent = movie.overview || "No synopsis available.";

    const subheadingGenres = document.createElement("div");
    subheadingGenres.className = "modal__subheading";
    subheadingGenres.textContent = "Tags";

    const pillRow = document.createElement("div");
    pillRow.className = "modal__pill-row";

    if (movie.genre_names && movie.genre_names.length) {
        movie.genre_names.forEach(name => {
            const pill = document.createElement("span");
            pill.className = "modal__pill";
            pill.textContent = name;
            pillRow.appendChild(pill);
        });
    } else {
        const pill = document.createElement("span");
        pill.className = "modal__pill";
        pill.textContent = "Musical / Music";
        pillRow.appendChild(pill);
    }

    const btnRow = document.createElement("div");
    btnRow.className = "modal__pill-row";
    btnRow.style.marginTop = "0.4rem";

    const watchlistBtn = document.createElement("button");
    watchlistBtn.className = "btn btn--primary";
    watchlistBtn.textContent = isInWatchlist(movie.id) ? "In watchlist" : "Add to watchlist";

    watchlistBtn.addEventListener("click", () => {
        toggleWatchlist(movie, watchlistBtn);
    });

    btnRow.appendChild(watchlistBtn);

    detailsDiv.appendChild(title);
    detailsDiv.appendChild(meta);
    detailsDiv.appendChild(overview);
    detailsDiv.appendChild(subheadingGenres);
    detailsDiv.appendChild(pillRow);
    detailsDiv.appendChild(btnRow);

    modalContent.appendChild(posterDiv);
    modalContent.appendChild(detailsDiv);

    movieModal.classList.add("modal--open");
    movieModal.setAttribute("aria-hidden", "false");
}

function closeMovieModal() {
    movieModal.classList.remove("modal--open");
    movieModal.setAttribute("aria-hidden", "true");
}

// ==== NAVIGATION BETWEEN SECTIONS ====

function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.toggle(
            "section--active",
            section.id === sectionId
        );
    });

    navLinks.forEach(link => {
        const target = link.getAttribute("data-section-target");
        link.classList.toggle("nav__link--active", target === sectionId);
    });
}

navLinks.forEach(link => {
    link.addEventListener("click", () => {
        const target = link.getAttribute("data-section-target");
        showSection(target);
    });
});

heroSearchForm.addEventListener("submit", (evt) => {
    evt.preventDefault();
    const query = heroSearchInput.value.trim();
    if (!query) return;
    showSection("browse");
    browseSearchInput.value = query;
    searchMusicals(query);
});

browseSearchForm.addEventListener("submit", (evt) => {
    evt.preventDefault();
    const query = browseSearchInput.value.trim();
    if (!query) return;
    searchMusicals(query);
});

applyFiltersBtn.addEventListener("click", (evt) => {
    evt.preventDefault();
    fetchFilteredMusicals();
});

sortWatchlistRatingBtn.addEventListener("click", () => {
    sortWatchlistByRatingDesc();
});

clearWatchlistBtn.addEventListener("click", () => {
    if (watchlist.length === 0) return;
    const confirmClear = window.confirm("Clear your entire watchlist?");
    if (!confirmClear) return;
    watchlist = [];
    saveWatchlist();
    renderWatchlist();
});

modalDismissElems.forEach(elem => {
    elem.addEventListener("click", () => {
        closeMovieModal();
    });
});

document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && movieModal.classList.contains("modal--open")) {
        closeMovieModal();
    }
});

function init() {
    loadWatchlist();
    renderWatchlist();
    fetchFeaturedMusicals();
}

init();
