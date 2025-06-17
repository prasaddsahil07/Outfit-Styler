async function fetchFashionNews() {
  try {
    const response = await fetch("http://localhost:3000/api/fashionNews");
    const data = await response.json();
    const articles = data.articles;
    const container = document.getElementById("carousel");

    container.innerHTML = "";

    articles.forEach(article => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${article.image}" alt="${article.title}" />
        <div class="card-content">
          <h3>${article.title}</h3>
          <p>${article.description || ""}</p>
          <div class="source">Source: ${article.source}</div>
          <div class="share-buttons">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(article.url)}" target="_blank" title="Share on Facebook">Facebook</a>
            <a href="https://wa.me/?text=${encodeURIComponent(article.title + ' - ' + article.url)}" target="_blank" title="Share on WhatsApp">WhatsApp</a>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching news:", err);
  }
}

function scrollCarousel(direction) {
  const carousel = document.getElementById("carousel");
  const cardWidth = carousel.querySelector(".card").offsetWidth + 16; // 16px gap
  carousel.scrollBy({ left: direction * cardWidth * 2, behavior: "smooth" });
}

fetchFashionNews();
