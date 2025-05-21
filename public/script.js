document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Get selected body part and occasion from the dropdowns
  const bodyPart = document.getElementById("selectBodyPart").value;
  const occasion = document.getElementById("selectOccasion").value;

  // Ensure both values are included in FormData
  formData.set("bodyPart", bodyPart);
  formData.set("occasion", occasion);

  const fileInput = form.querySelector('input[type="file"]');
  const file = fileInput.files[0];

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  // Preview the original image
  const reader = new FileReader();
  reader.onload = () => {
    const div = document.createElement("div");
    div.innerHTML = `<h3>Original Outfit</h3><img src="${reader.result}" width="300" />`;
    resultsDiv.appendChild(div);
  };
  reader.readAsDataURL(file);

  // Show loading message
  const loading = document.createElement("p");
  loading.textContent = "Generating styled images...";
  resultsDiv.appendChild(loading);

  try {
    const res = await fetch("/generate-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    loading.remove(); // Remove the loading message

    data.results.forEach(({ style, base64, error }) => {
      const div = document.createElement("div");
      if (base64) {
        div.innerHTML = `<h3>${style}</h3><img src="data:image/png;base64,${base64}" width="300" />`;
      } else {
        div.innerHTML = `<h3>${style}</h3><p>Error: ${error}</p>`;
      }
      resultsDiv.appendChild(div);
    });
  } catch (err) {
    resultsDiv.innerHTML = "<p>Something went wrong!</p>";
    console.error(err);
  }
});
