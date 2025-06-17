function renderData(data) {
  const primaryImageContainer = document.getElementById("primary-image-container");
  const productGrid = document.getElementById("product-grid");
  const likesEl = document.getElementById("likes");
  const captionEl = document.getElementById("caption");

  primaryImageContainer.innerHTML = "";
  productGrid.innerHTML = "";
  likesEl.textContent = "";
  captionEl.textContent = "";

  // Image section
  const img = document.createElement("img");
  img.src = data.image;
  img.alt = "Main Fashion Image";
  primaryImageContainer.appendChild(img);

  // Append Instagram-style icons
  const iconsDiv = document.createElement("div");
  iconsDiv.className = "post-icons";

  const heartIcon = document.createElement("span");
  heartIcon.className = "icon";
  heartIcon.textContent = "❤️";

  const commentIcon = document.createElement("span");
  commentIcon.className = "icon";
  commentIcon.textContent = "💬";

  iconsDiv.appendChild(heartIcon);
  iconsDiv.appendChild(commentIcon);
  primaryImageContainer.appendChild(iconsDiv);

  // Meta
  likesEl.textContent = `${data.likes} likes`;
  captionEl.textContent = data.caption || "";

  // Affiliate products
  data.affiliateProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product";

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "image-wrapper";

    const thumbnail = document.createElement("img");
    thumbnail.src = product.thumbnail;
    thumbnail.alt = product.keyword || "Product Image";

    imgWrapper.appendChild(thumbnail);
    card.appendChild(imgWrapper);

    const link = document.createElement("a");
    link.href = product.affiliated_link;
    link.target = "_blank";
    link.innerText = product.title;

    card.appendChild(link);
    productGrid.appendChild(card);
  });
}


const data = fetch("http://localhost:3000/api/instaPosts/dailyPostInstagram", {
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  }
}).then(response => {
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}).then(data => {
  if (data && data.image && data.affiliateProducts) {
    renderData(data);
  } else {
    console.error("Invalid data format:", data);
  }
}).catch(error => {
  console.error("Error fetching data:", error);
  const primaryImageContainer = document.getElementById("primary-image-container");
  primaryImageContainer.innerHTML = "<p>Error loading data. Please try again later.</p>";
});