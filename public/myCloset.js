async function fetchClosetData() {
  try {
    const response = await fetch('dummyClosetData.json');
    if (!response.ok) throw new Error('Failed to fetch closet data');
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
}

function renderList(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // Clear before rendering
  const ul = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

async function renderTrendingImages(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const weatherSelect = document.getElementById("weather-select");
  let weather = weatherSelect ? weatherSelect.value : "summer";

  // Capitalize the weather for display
  const heading = document.getElementById("trending-heading");
  if (heading) {
    heading.textContent = `Trending Items for ${weather.charAt(0).toUpperCase() + weather.slice(1)}`;
  }

  container.innerHTML = "";

  try {
    const response = await fetch(`/api/closet/${weather}`);
    const imageFiles = await response.json();
    const imagesToShow = imageFiles.slice(0, 5);

    imagesToShow.forEach(filename => {
      const img = document.createElement("img");
      img.src = `/closet/${weather}_collection/${filename}`;
      img.alt = `${weather} trending item`;
      container.appendChild(img);
    });
  } catch (err) {
    console.error("Error fetching images:", err);
    container.textContent = "Could not load trending items.";
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  const closetItems = await fetchClosetData();
  if (!closetItems) return;

  renderList("category-list", closetItems.categories);
  renderList("occasion-list", closetItems.occasions);
  renderList("fabric-list", closetItems.fabrics);
  renderTrendingImages("trending-items", closetItems.trendingItems);
  const weatherSelect = document.getElementById("weather-select");
  if (weatherSelect) {
    weatherSelect.addEventListener("change", () => {
      renderTrendingImages("trending-items");
    });
  }
});
