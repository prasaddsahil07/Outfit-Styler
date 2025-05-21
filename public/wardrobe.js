document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get selected body part and occasion from the dropdowns
    const bodyPart = document.getElementById("selectBodyPart").value;
    const occasion = document.getElementById("selectOccasion").value;

    // Ensure both values are included in FormData
    // formData.set("bodyPart", bodyPart);
    // formData.set("occasion", occasion);

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    // Show loading message
    const loading = document.createElement("p");
    loading.textContent = "Generating styled images...";
    resultsDiv.appendChild(loading);

    try {
        const res = await fetch("/generate-image-from-wardrobe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ bodyPart, occasion }),
        });

        const data = await res.json();
        loading.remove();

        if (!data.results || !Array.isArray(data.results)) {
            resultsDiv.innerHTML = `<p>Error: ${data.error || "Unexpected response format"}</p>`;
            return;
        }

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
