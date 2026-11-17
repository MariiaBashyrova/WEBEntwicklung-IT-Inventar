let pcs = [];
const purposeSelect = document.getElementById("purpose-filter");
const searchInput = document.getElementById("search-input");
const radioButtons = document.querySelectorAll('input[name="ip-type"]');
purposeSelect.addEventListener("change", filterPCs);
searchInput.addEventListener("input", filterPCs);
radioButtons.forEach(radio => {
    radio.addEventListener("change", filterPCs);
});
const updateCheckbox = document.getElementById("update-filter");

updateCheckbox.addEventListener("change", filterPCs);
const tableBody = document.getElementById("pc-table-body");

tableBody.addEventListener("click", event => {
    const row = event.target.closest("tr[data-id]");

    if (!row) return;

    const pc = pcs.find(pc => pc.id == row.dataset.id);

    if (pc) {
        showDetails(pc);
    }
});
const closeButton = document.getElementById("close-dialog");
closeButton.addEventListener("click", () => {
    const modal = document.getElementById("pc-dialog");
    modal.close();
});

function loadData() {
    return fetch("data/pcs.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Fehler beim Laden der Daten");
            }
            return response.json();
        })
        .then(data => {
            return data.map(item => {
                const pc = item.PC_DATA;

                return {
                    id: pc.pcId,
                    description: pc.Description,
                    purpose: pc.Purpose,
                    user: {
                        id: pc.MainUser.userId,
                        name: pc.MainUser.userName
                    },
                    ips: pc.IPAddresses.map(ip => ({
                        value: ip.Value,
                        type: ip.Type
                    }))
                };
            });
        });
}

function renderTable(data) {
    const tableBody = document.getElementById("pc-table-body");
    const noResults = document.getElementById("no-results");
    const resultCount = document.getElementById("result-count");
    const pcCardsContainer = document.getElementById("pc-cards");
    pcCardsContainer.innerHTML = ""; // Clear previous cards
    resultCount.textContent = ` ${data.length} von ${pcs.length} Rechnern`;
    tableBody.innerHTML = "";

    if (data.length === 0) {
        noResults.hidden = false;
        return;
    }

    noResults.hidden = true;

    data.forEach(pc => {
        const row = document.createElement("tr");
        const idCell = document.createElement("td");
        idCell.textContent = pc.id;
        row.dataset.id = pc.id;
        row.appendChild(idCell);
        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = pc.description;
        if (pc.description.includes("Updaten!")) {
            row.classList.add("update-noetig");
        }
        row.appendChild(descriptionCell);
        const purposeCell = document.createElement("td");
        purposeCell.textContent = pc.purpose;
        row.appendChild(purposeCell);
        const userCell = document.createElement("td");
        userCell.textContent = pc.user.name;
        row.appendChild(userCell);
        const ipsCell = document.createElement("td");
        if (pc.ips.length === 0) {
            ipsCell.textContent = "-- Keine --";
        } else {   
            ipsCell.textContent = pc.ips.map(ip => `${ip.value} (${ip.type})`).join("\n");
        }

        row.appendChild(ipsCell);
        tableBody.appendChild(row);
        // Kartenansicht für mobile Geräte
        const card = document.createElement("article");
        card.dataset.id = pc.id;
        card.addEventListener("click", () => showDetails(pc));
        if (pc.description.includes("Updaten!")) {
            card.classList.add("update-noetig");
        }
        card.classList.add("pc-card-article");
        card.innerHTML = `
            <p><strong>PC-Nr. ${pc.id} [${pc.purpose}]</strong></p>
            <p>${pc.description}</p>
           
            <p> ${pc.user.name} (ID: ${pc.user.id})</p>
            <p> ${pc.ips.length > 0 ? pc.ips.map(ip => `${ip.value} (${ip.type})`).join(", ") : "-- Keine --"}</p>
        `;
        pcCardsContainer.appendChild(card);  
        
    });
    
}

function Einsatzzweck(data) {
    const purposeSelect = document.getElementById("purpose-filter");
    const uniquePurposes = [...new Set(data.map(pc => pc.purpose))];
    purposeSelect.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Alle";
    purposeSelect.appendChild(allOption);
    uniquePurposes.forEach(purpose => {
        const option = document.createElement("option");
        option.value = purpose;
        option.textContent = purpose;
        purposeSelect.appendChild(option);
    });
}

loadData()
    .then(data => {
        pcs = data;
        renderTable(pcs);
        Einsatzzweck(pcs);
    })
    .catch(error => {
        console.error(error);
    });

function filterPCs() {
    const selectedPurpose = purposeSelect.value;
    const searchText = searchInput.value.toLowerCase();
    const selectedIpType = document.querySelector('input[name="ip-type"]:checked')?.value;
    const updateChecked = updateCheckbox.checked;

    const filteredPCs = pcs.filter(pc => {

        const matchesPurpose =
            selectedPurpose === "all" ||
            pc.purpose === selectedPurpose;

        const matchesSearch =
            pc.user.name.toLowerCase().includes(searchText) ||
            pc.description.toLowerCase().includes(searchText);
        
        const matchesIpType = selectedIpType === "all" || pc.ips.some(ip => ip.type === selectedIpType);

        const matchesUpdate = !updateChecked || pc.description.toLowerCase().includes("updaten");

        return matchesPurpose && matchesSearch && matchesIpType && matchesUpdate;
    });

    renderTable(filteredPCs);
}    

function showDetails(pc) {
    const modal = document.getElementById("pc-dialog");
    const modalContent = document.getElementById("dialog-content");
    const modalTitle = document.getElementById("dialog-title");
    const ip4 = pc.ips.filter(ip => ip.type === "v4");
    const ip6 = pc.ips.filter(ip => ip.type === "v6");
    const weitereRechner = pcs.filter(otherPc => otherPc.user.name === pc.user.name && otherPc.id !== pc.id);
    modalTitle.textContent = "PC-Details: " + pc.id;
    modalContent.innerHTML = `
        <p><strong>Beschreibung:</strong> ${pc.description}</p>
        <p><strong>Zweck:</strong> ${pc.purpose}</p>
        <p><strong>Hauptnutzer:</strong> ${pc.user.name} (ID: ${pc.user.id})</p>
        ${ip4.length > 0 ? `<p><strong>IPv4:</strong> </p><ul>${ip4.map(ip => `<li>${ip.value}</li>`).join("")}</ul>` : ""}
        ${ip6.length > 0 ? `<p><strong>IPv6:</strong> </p><ul>${ip6.map(ip => `<li>${ip.value}</li>`).join("")}</ul>` : ""}
        ${weitereRechner.length > 0 ? `<p><strong>Weitere Rechner von ${pc.user.name}:</strong></p><ul>${weitereRechner.map(otherPc => `<li>${otherPc.description} (PC-Nr.: ${otherPc.id})</li>`).join("")}</ul>` : ""}
    `;

    modal.showModal();
}