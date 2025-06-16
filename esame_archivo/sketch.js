let allImages = [];
let classTypes = new Set();

fetch('data_yolo.json')
  .then(response => response.json())
  .then(data => {
    processData(data);
    populateFilter();
    applyFilter("all");
  })
  .catch(err => {
    console.error("Errore nel caricamento del JSON:", err);
  });

function processData(data) {
  data.forEach(item => {
    const baseName = item.FileName;
    const ext = (item.FileExtension || ".jpg").toLowerCase();
    const classes = (item.Detections || []).map(d => d.class);
    const crops = item.Crops || [];

    crops.forEach((cropName, index) => {
      const cropClass = classes[index] || "unknown";
      classTypes.add(cropClass);

      allImages.push({
        filename: cropName,
        class: cropClass
      });
    });
  });
}

function populateFilter() {
  const select = document.getElementById('filterSelect');
  [...classTypes].sort().forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    applyFilter(select.value);
  });
}

function applyFilter(filterClass) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  const filtered = allImages.filter(img => filterClass === "all" || img.class === filterClass);

  filtered.forEach(img => {
    const el = document.createElement("img");
    el.src = `crops_64/${img.filename}`;
    el.alt = img.class;
    el.className = "img-thumb";
    gallery.appendChild(el);
  });
}
