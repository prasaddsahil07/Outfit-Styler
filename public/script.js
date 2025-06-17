document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Get selected body part and occasion
  const bodyPart = document.getElementById("selectBodyPart").value;
  const occasion = document.getElementById("selectOccasion").value;

  formData.set("bodyPart", bodyPart);
  formData.set("occasion", occasion);

  const fileInput = form.querySelector('input[type="file"]');
  const file = fileInput.files[0];

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  // Preview the original uploaded image
  const reader = new FileReader();
  reader.onload = () => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>Original Outfit</h3><img src="${reader.result}" width="300" />`;
    resultsDiv.appendChild(div);
  };
  reader.readAsDataURL(file);

  // Show loading indicator
  const loading = document.createElement("p");
  loading.textContent = "Generating styled images...";
  resultsDiv.appendChild(loading);

  try {
    const res = await fetch("/upload/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    loading.remove();

    // Show AI-styled looks
    data.aiStyledLooks.forEach(({ style, base64, error }) => {
      const div = document.createElement("div");
      if (base64) {
        div.innerHTML = `<h3>${style}</h3><img src="data:image/png;base64,${base64}" width="300" />`;
      } else {
        div.innerHTML = `<h3>${style}</h3><p>Error: ${error}</p>`;
      }
      resultsDiv.appendChild(div);
    });

    // Show wardrobe matches
    if (data.wardrobeMatches && data.wardrobeMatches.length > 0) {
      const matchHeader = document.createElement("h3");
      matchHeader.textContent = "Matching Items from Your Wardrobe";
      resultsDiv.appendChild(matchHeader);

      data.wardrobeMatches.forEach(({ imageUrl, garment }) => {
        const matchDiv = document.createElement("div");
        matchDiv.innerHTML = `
          <img src="${imageUrl}" width="200" />
          <ul>
            <li><strong>Category:</strong> ${garment.category}</li>
            <li><strong>Color:</strong> ${garment.color}</li>
            <li><strong>Fabric:</strong> ${garment.fabric}</li>
            <li><strong>Pattern:</strong> ${garment.pattern}</li>
            <li><strong>Occasion:</strong> ${garment.occasion?.join(", ")}</li>
          </ul>
        `;
        resultsDiv.appendChild(matchDiv);
      });
    } else {
      const noMatches = document.createElement("p");
      noMatches.textContent = "No matching wardrobe items found. Try uploading more pieces!";
      resultsDiv.appendChild(noMatches);
    }

  } catch (err) {
    resultsDiv.innerHTML = "<p>Something went wrong!</p>";
    console.error(err);
  }
});
