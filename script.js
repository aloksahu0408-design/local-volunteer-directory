"use strict";

// Read saved data safely. If storage is missing or invalid, use the fallback.
function readStorage(key, fallback) {
    try {
        const savedValue = localStorage.getItem(key);
        return savedValue === null ? fallback : JSON.parse(savedValue);
    } catch (error) {
        console.warn(`Could not read "${key}" from local storage.`, error);
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Could not save "${key}" to local storage.`, error);
        alert("Your browser could not save this change. Check that local storage is enabled.");
    }
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeAvailability(value) {
    const values = Array.isArray(value) ? value : (value ? [value] : []);
    return values.map(item => item === "Evenings" ? "Evening" : item);
}

const defaultVolunteers = [
    {
        id: "sample-alok",
        name: "Alok Kumar",
        location: "Motihari",
        skills: "Teaching, Event Management",
        availability: ["Weekends"],
        status: "Available"
    },
    {
        id: "sample-sachin",
        name: "Sachin Kumar",
        location: "Patna",
        skills: "First Aid, Social Work",
        availability: ["Evening"],
        status: "Available"
    },
    {
        id: "sample-rohan",
        name: "Rohan kar",
        location: "Jalandhar",
        skills: "Food Distribution",
        availability: ["Weekends"],
        status: "Busy"
    }
];

const volunteerStorageExists = localStorage.getItem("volunteers") !== null;
let volunteers = readStorage("volunteers", null);
let requests = readStorage("requests", []);
let favoriteVolunteers = readStorage("favoriteVolunteers", []);
let editingVolunteerId = null;

if (!Array.isArray(volunteers)) {
    volunteers = volunteerStorageExists ? [] : defaultVolunteers.map(item => ({ ...item }));
}

volunteers = volunteers.map(volunteer => ({
    ...volunteer,
    id: volunteer.id || createId(),
    name: volunteer.name || "",
    location: volunteer.location || "",
    skills: volunteer.skills || "",
    availability: normalizeAvailability(volunteer.availability),
    status: volunteer.status === "Busy" ? "Busy" : "Available"
}));

if (!Array.isArray(requests)) {
    requests = [];
}

requests = requests.map(request => ({
    ...request,
    id: request.id || createId(),
    name: request.name || "Volunteer",
    status: ["Pending", "Accepted", "Rejected"].includes(request.status)
        ? request.status
        : "Pending",
    date: request.date || new Date().toLocaleString()
}));

if (!Array.isArray(favoriteVolunteers)) {
    favoriteVolunteers = [];
}

// Keep compatibility with older favorites stored as name/location pairs.
favoriteVolunteers = favoriteVolunteers
    .map(favorite => {
        if (favorite.id) {
            return favorite;
        }

        const matchingVolunteer = volunteers.find(item =>
            item.name === favorite.name && item.location === favorite.location
        );

        return matchingVolunteer ? { id: matchingVolunteer.id } : null;
    })
    .filter(Boolean);

saveStorage("volunteers", volunteers);
saveStorage("requests", requests);
saveStorage("favoriteVolunteers", favoriteVolunteers);

const volunteerForm = document.getElementById("volunteerForm");
const volunteerNameInput = document.getElementById("volunteerName");
const volunteerLocationInput = document.getElementById("volunteerLocation");
const volunteerSkillsInput = document.getElementById("volunteerSkills");
const volunteerStatusInput = document.getElementById("volunteerStatus");
const availabilityError = document.getElementById("availabilityError");
const addVolunteerBtn = document.getElementById("addVolunteerBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const volunteerList = document.querySelector(".volunteer-list");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const availabilityFilter = document.getElementById("availabilityFilter");
const sortFilter = document.getElementById("sortFilter");
const favoriteFilter = document.getElementById("favoriteFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const requestCountElement = document.getElementById("requestCount");
const volunteerCountElement = document.getElementById("volunteerCount");
const directoryCountElement = document.getElementById("directoryCount");
const requestList = document.getElementById("requestList");
const reportBox = document.getElementById("reportBox");
const viewRequestsBtn = document.getElementById("viewRequestsBtn");
const viewReportsBtn = document.getElementById("viewReportsBtn");

function getSelectedAvailability() {
    return Array.from(
        document.querySelectorAll('input[name="availability"]:checked')
    ).map(checkbox => checkbox.value);
}

function clearAvailabilityCheckboxes() {
    document.querySelectorAll('input[name="availability"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function resetVolunteerForm() {
    volunteerForm.reset();
    editingVolunteerId = null;
    addVolunteerBtn.textContent = "Add Volunteer";
    document.getElementById("formHeading").textContent = "Add a volunteer";
    cancelEditBtn.hidden = true;
    availabilityError.textContent = "";
}

function updateCounts() {
    const volunteerText = `${volunteers.length} ${volunteers.length === 1 ? "volunteer" : "volunteers"}`;
    const requestText = `${requests.length} ${requests.length === 1 ? "request" : "requests"}`;

    volunteerCountElement.textContent = volunteerText;
    directoryCountElement.textContent = volunteerText;
    requestCountElement.textContent = requestText;
}

function isFavorite(volunteerId) {
    return favoriteVolunteers.some(favorite => favorite.id === volunteerId);
}

function toggleFavorite(volunteer) {
    if (isFavorite(volunteer.id)) {
        favoriteVolunteers = favoriteVolunteers.filter(item => item.id !== volunteer.id);
    } else {
        favoriteVolunteers.push({ id: volunteer.id });
    }

    saveStorage("favoriteVolunteers", favoriteVolunteers);
    displayVolunteers();
}

function addTextLine(parent, label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}: `;
    paragraph.append(strong, document.createTextNode(value));
    parent.appendChild(paragraph);
}

function showProfile(volunteer) {
    const profileBox = document.getElementById("profileBox");
    const profileDetails = document.getElementById("profileDetails");

    profileDetails.replaceChildren();
    profileDetails.className = "profile-details";

    const details = [
        ["Name", volunteer.name],
        ["Location", volunteer.location],
        ["Skills", volunteer.skills],
        ["Availability", volunteer.availability.join(", ") || "Not specified"],
        ["Status", volunteer.status]
    ];

    details.forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "profile-detail";

        const heading = document.createElement("strong");
        heading.textContent = label;

        const text = document.createElement("span");
        text.textContent = value;

        item.append(heading, text);
        profileDetails.appendChild(item);
    });

        profileBox.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("closeProfile").focus();
}

function beginEditing(volunteer) {
    if (volunteer.ownerId && volunteer.ownerId !== window.currentUser?.uid) {
        showToast("You can only edit volunteers you added.");
        return;
    }
    showView("add");
    editingVolunteerId = volunteer.id;
    volunteerNameInput.value = volunteer.name;
    volunteerLocationInput.value = volunteer.location;
    volunteerSkillsInput.value = volunteer.skills;
    volunteerStatusInput.value = volunteer.status;

    clearAvailabilityCheckboxes();
    document.querySelectorAll('input[name="availability"]').forEach(checkbox => {
        checkbox.checked = volunteer.availability.includes(checkbox.value);
    });

    addVolunteerBtn.textContent = "Update Volunteer";
    document.getElementById("formHeading").textContent = "Edit volunteer";
    cancelEditBtn.hidden = false;
    availabilityError.textContent = "";

    document.querySelector(".add-volunteer").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    volunteerNameInput.focus({ preventScroll: true });
}

function askConfirm(message) {
    const modal = document.getElementById("confirmModal");
    const text = document.getElementById("confirmText");
    const okBtn = document.getElementById("confirmOkBtn");
    const cancelBtn = document.getElementById("confirmCancelBtn");

    text.textContent = message;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    cancelBtn.focus();

    return new Promise(resolve => {
        function close(result) {
            modal.hidden = true;
            document.body.classList.remove("modal-open");
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            modal.removeEventListener("click", onBackdrop);
            document.removeEventListener("keydown", onKey);
            resolve(result);
        }

        function onOk() { close(true); }
        function onCancel() { close(false); }
        function onBackdrop(event) {
            if (event.target === modal) close(false);
        }
        function onKey(event) {
            if (event.key === "Escape") close(false);
        }

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        modal.addEventListener("click", onBackdrop);
        document.addEventListener("keydown", onKey);
    });
}

async function deleteVolunteer(volunteer) {
    const confirmed = await askConfirm(`"${volunteer.name}" ko directory se hata du?`);

    if (!confirmed) {
        return;
    }

    try {
        await window.fb.deleteDoc(window.fb.doc(window.fb.db, "volunteers", volunteer.id));
        showToast(`${volunteer.name} was deleted.`);
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Could not delete. Check the console.");
    }
}

let toastTimer = null;

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

async function sendRequest(volunteer) {
    if (!window.currentUser) {
        showToast("Please login first.");
        return;
    }

    try {
        await window.fb.addDoc(window.fb.collection(window.fb.db, "requests"), {
            volunteerId: volunteer.id,
            volunteerName: volunteer.name,
            volunteerOwnerId: volunteer.ownerId || "",
            requesterId: window.currentUser.uid,
            requesterName: window.currentUser.displayName || window.currentUser.email || "User",
            status: "Pending",
            createdAt: new Date().toISOString()
        });
        showToast(`Request sent to ${volunteer.name}.`);
    } catch (error) {
        console.error("Request error:", error);
        showToast("Could not send request. Check the console.");
    }
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

function createChipList(items, className) {
    const list = document.createElement("div");
    list.className = "chip-list";

    items.forEach(text => {
        const chip = document.createElement("span");
        chip.className = className;
        chip.textContent = text;
        list.appendChild(chip);
    });

    return list;
}

function createVolunteerCard(volunteer) {
    const card = document.createElement("article");
    card.className = "volunteer-card";

    const top = document.createElement("div");
    top.className = "card-top";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = getInitials(volunteer.name);

    const titleBox = document.createElement("div");
    titleBox.className = "card-title";

    const heading = document.createElement("h3");
    heading.textContent = volunteer.name;

    const location = document.createElement("p");
    location.className = "card-location";
    location.textContent = `📍 ${volunteer.location}`;

    titleBox.append(heading, location);

    const statusPill = document.createElement("span");
    statusPill.className = `status-pill ${volunteer.status === "Available" ? "status-available" : "status-busy"}`;
    statusPill.textContent = volunteer.status;

    top.append(avatar, titleBox, statusPill);

    const skillsLabel = document.createElement("p");
    skillsLabel.className = "card-label";
    skillsLabel.textContent = "Skills";

    const skillItems = volunteer.skills
        .split(",")
        .map(skill => skill.trim())
        .filter(Boolean);

    const availabilityLabel = document.createElement("p");
    availabilityLabel.className = "card-label";
    availabilityLabel.textContent = "Availability";

    const availabilityItems = volunteer.availability.length > 0
        ? volunteer.availability
        : ["Not specified"];

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const viewButton = makeButton("View profile", "button button-secondary", () => showProfile(volunteer));
    const editButton = makeButton("Edit", "button button-edit", () => beginEditing(volunteer));
    const deleteButton = makeButton("Delete", "button button-delete", () => deleteVolunteer(volunteer));
    const favoriteButton = makeButton(
        isFavorite(volunteer.id) ? "★ Favorited" : "☆ Favorite",
        "button button-favorite",
        () => toggleFavorite(volunteer)
    );
    
    const requestButton = makeButton("Request help", "button button-request", () => sendRequest(volunteer));

    const isOwner = volunteer.ownerId && volunteer.ownerId === window.currentUser?.uid;
    actions.append(viewButton, favoriteButton);
    if (isOwner) {
        actions.append(editButton, deleteButton);
    } else {
        actions.append(requestButton);
    }
    card.append(
        top,
        skillsLabel,
        createChipList(skillItems, "chip"),
        availabilityLabel,
        createChipList(availabilityItems, "chip chip-time"),
        actions
    );

    return card;
}
function makeButton(text, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
}

function displayVolunteers() {
    volunteerList.replaceChildren();

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedAvailability = availabilityFilter.value;
    const favoritesOnly = favoriteFilter.checked;

    let displayedVolunteers = volunteers.filter(volunteer => {
        const searchableText = [
            volunteer.name,
            volunteer.location,
            volunteer.skills,
            volunteer.availability.join(" ")
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);
        const matchesStatus = selectedStatus === "All" || volunteer.status === selectedStatus;
        const matchesAvailability =
            selectedAvailability === "All" ||
            volunteer.availability.includes(selectedAvailability);
        const matchesFavorite = !favoritesOnly || isFavorite(volunteer.id);

        return matchesSearch && matchesStatus && matchesAvailability && matchesFavorite;
    });

    if (sortFilter.value === "nameAZ") {
        displayedVolunteers.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortFilter.value === "nameZA") {
        displayedVolunteers.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortFilter.value === "availableFirst") {
        displayedVolunteers.sort((a, b) =>
            Number(b.status === "Available") - Number(a.status === "Available")
        );
    } else if (sortFilter.value === "busyFirst") {
        displayedVolunteers.sort((a, b) =>
            Number(b.status === "Busy") - Number(a.status === "Busy")
        );
    }

    if (displayedVolunteers.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = volunteers.length === 0
            ? "There are no volunteers yet. Add one using the form above."
            : "No volunteers match those filters.";
        volunteerList.appendChild(emptyMessage);
    } else {
        displayedVolunteers.forEach(volunteer => {
            volunteerList.appendChild(createVolunteerCard(volunteer));
        });
    }

    updateCounts();
}

async function clearHandledRequests() {
    if (!confirm("Remove all accepted and rejected requests?")) {
        return;
    }

    const handled = requests.filter(item => item.status !== "Pending");

    try {
        await Promise.all(
            handled.map(item => window.fb.deleteDoc(window.fb.doc(window.fb.db, "requests", item.id)))
        );
        showToast("Handled requests cleared.");
    } catch (error) {
        console.error("Clear requests error:", error);
        showToast("Could not clear. Check the console.");
    }
}
let requestsUnsubscribe = null;

function startRequestListener() {
    if (!window.fb || !window.currentUser) {
        return;
    }

    if (requestsUnsubscribe) {
        requestsUnsubscribe();
    }

    const uid = window.currentUser.uid;
    const requestsRef = window.fb.collection(window.fb.db, "requests");

    const mine = window.fb.query(requestsRef, window.fb.where("requesterId", "==", uid));
    const toMe = window.fb.query(requestsRef, window.fb.where("volunteerOwnerId", "==", uid));

    let mineDocs = [];
    let toMeDocs = [];

    function publish() {
        const merged = new Map();
        [...mineDocs, ...toMeDocs].forEach(item => merged.set(item.id, item));
        requests = Array.from(merged.values());

        updateCounts();
        renderRequests();
        if (!reportBox.hidden) {
            renderReports();
        }
    }

    const unsubMine = window.fb.onSnapshot(mine, snapshot => {
        mineDocs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        publish();
    }, error => console.error("Requests read error:", error));

    const unsubToMe = window.fb.onSnapshot(toMe, snapshot => {
        toMeDocs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        publish();
    }, error => console.error("Requests read error:", error));

    requestsUnsubscribe = () => {
        unsubMine();
        unsubToMe();
    };
}

function renderRequests() {
    requestList.replaceChildren();

    if (requests.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = "No requests yet.";
        requestList.appendChild(emptyMessage);
        return;
    }

    const handledCount = requests.filter(item => item.status !== "Pending").length;

    if (handledCount > 0) {
        requestList.appendChild(
            makeButton(
                `Clear handled requests (${handledCount})`,
                "button button-secondary clear-requests-btn",
                clearHandledRequests
            )
        );
    }

    requests.forEach(request => {
        const item = document.createElement("article");
        item.className = "request-item";

        const heading = document.createElement("h3");
        heading.textContent = request.volunteerName || request.name || "Volunteer";

        const statusLine = document.createElement("p");
        statusLine.append("Status: ");

        const status = document.createElement("span");
        status.className = `request-status ${String(request.status).toLowerCase()}`;
        status.textContent = request.status;
        statusLine.appendChild(status);

        const date = document.createElement("p");
        date.textContent = `Date: ${new Date(request.createdAt).toLocaleString()}`;

        item.append(heading, statusLine, date);

        const isVolunteerOwner = request.volunteerOwnerId === window.currentUser?.uid;

        if (request.status === "Pending" && isVolunteerOwner) {
            const actions = document.createElement("div");
            actions.className = "request-actions";

            actions.append(
                makeButton("Accept", "button button-accept", () => updateRequestStatus(request.id, "Accepted")),
                makeButton("Reject", "button button-reject", () => updateRequestStatus(request.id, "Rejected"))
            );
            item.appendChild(actions);
        }

        requestList.appendChild(item);
    });
}

async function updateRequestStatus(requestId, newStatus) {
    try {
        await window.fb.updateDoc(window.fb.doc(window.fb.db, "requests", requestId), {
            status: newStatus
        });
        showToast(`Request ${newStatus.toLowerCase()}.`);
    } catch (error) {
        console.error("Update request error:", error);
        showToast("Could not update request. Check the console.");
    }
}

function renderReports() {
    reportBox.replaceChildren();

    const available = volunteers.filter(item => item.status === "Available").length;
    const busy = volunteers.filter(item => item.status === "Busy").length;
    const pending = requests.filter(item => item.status === "Pending").length;
    const accepted = requests.filter(item => item.status === "Accepted").length;
    const rejected = requests.filter(item => item.status === "Rejected").length;

    const stats = [
        ["Total volunteers", volunteers.length],
        ["Available", available],
        ["Busy", busy],
        ["Total requests", requests.length],
        ["Pending requests", pending],
        ["Accepted requests", accepted],
        ["Rejected requests", rejected]
    ];

    const grid = document.createElement("div");
    grid.className = "report-grid";

    stats.forEach(([label, value]) => {
        const stat = document.createElement("div");
        stat.className = "report-stat";

        const number = document.createElement("strong");
        number.textContent = value;

        const caption = document.createElement("span");
        caption.textContent = label;

        stat.append(number, caption);
        grid.appendChild(stat);
    });

    reportBox.appendChild(grid);
}

volunteerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = volunteerNameInput.value.trim();
    const location = volunteerLocationInput.value.trim();
    const skills = volunteerSkillsInput.value.trim();
    const availability = getSelectedAvailability();
    const wasEditing = Boolean(editingVolunteerId);

    if (!name || !location || !skills) {
        volunteerForm.reportValidity();
        return;
    }

    if (availability.length === 0) {
        availabilityError.textContent = "Select at least one availability option.";
        return;
    }

    if (!window.currentUser) {
        showToast("Please login first.");
        return;
    }

    availabilityError.textContent = "";
    addVolunteerBtn.disabled = true;

    const data = {
        name,
        location,
        skills,
        availability,
        status: volunteerStatusInput.value,
        ownerId: window.currentUser.uid
    };

    try {
        if (editingVolunteerId) {
            await window.fb.updateDoc(
                window.fb.doc(window.fb.db, "volunteers", editingVolunteerId),
                data
            );
        } else {
            await window.fb.addDoc(window.fb.collection(window.fb.db, "volunteers"), data);
        }

        resetVolunteerForm();
        showView("directory");
        showToast(wasEditing ? `${name} was updated.` : `${name} was added.`);
    } catch (error) {
        console.error("Save error:", error);
        showToast("Could not save. Check the console.");
    } finally {
        addVolunteerBtn.disabled = false;
    }
});

cancelEditBtn.addEventListener("click", () => {
    resetVolunteerForm();
    showView("directory");
});

function closeProfileBox() {
    document.getElementById("profileBox").hidden = true;
    document.body.classList.remove("modal-open");
}

document.getElementById("closeProfile").addEventListener("click", closeProfileBox);

document.getElementById("profileBox").addEventListener("click", event => {
    if (event.target === event.currentTarget) {
        closeProfileBox();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !document.getElementById("profileBox").hidden) {
        closeProfileBox();
    }
});

searchInput.addEventListener("input", displayVolunteers);
statusFilter.addEventListener("change", displayVolunteers);
availabilityFilter.addEventListener("change", displayVolunteers);
sortFilter.addEventListener("change", displayVolunteers);
favoriteFilter.addEventListener("change", displayVolunteers);

clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    statusFilter.value = "All";
    availabilityFilter.value = "All";
    sortFilter.value = "Default";
    favoriteFilter.checked = false;
    displayVolunteers();
});

viewRequestsBtn.addEventListener("click", () => {
    const shouldOpen = requestList.hidden;

    requestList.hidden = !shouldOpen;
    viewRequestsBtn.setAttribute("aria-expanded", String(shouldOpen));
    viewRequestsBtn.textContent = shouldOpen ? "Hide requests" : "View requests";

    if (shouldOpen) {
        renderRequests();
    }
});

viewReportsBtn.addEventListener("click", () => {
    const shouldOpen = reportBox.hidden;

    reportBox.hidden = !shouldOpen;
    viewReportsBtn.setAttribute("aria-expanded", String(shouldOpen));
    viewReportsBtn.textContent = shouldOpen ? "Hide reports" : "View reports";

    if (shouldOpen) {
        renderReports();
    }
});

document.getElementById("viewVolunteersBtn").addEventListener("click", () => {
    document.querySelector(".volunteer-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

displayVolunteers();

const landing = document.getElementById("landing");
const appRoot = document.getElementById("appRoot");
const loginModal = document.getElementById("loginModal");

function openLoginModal() {
    loginModal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("googleLoginBtn").focus();
}

function closeLoginModal() {
    loginModal.hidden = true;
    document.body.classList.remove("modal-open");
}

function enterApp() {
    closeLoginModal();
    landing.hidden = true;
    appRoot.hidden = false;
    window.scrollTo(0, 0);
}

document.getElementById("getStartedBtn").addEventListener("click", openLoginModal);
document.getElementById("closeLogin").addEventListener("click", closeLoginModal);

loginModal.addEventListener("click", event => {
    if (event.target === event.currentTarget) {
        closeLoginModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !loginModal.hidden) {
        closeLoginModal();
    }
});


const directorySections = document.querySelectorAll(".welcome, .volunteer-section, .dashboard");
const addSection = document.querySelector(".add-volunteer");

function showView(viewName) {
    directorySections.forEach(section => {
        section.hidden = viewName !== "directory";
    });
    addSection.hidden = viewName !== "add";
    window.scrollTo(0, 0);
}

document.getElementById("openAddBtn").addEventListener("click", event => {
    event.preventDefault();
    showView("add");
    volunteerNameInput.focus();
});

document.getElementById("backToDirectoryBtn").addEventListener("click", () => {
    resetVolunteerForm();
    showView("directory");
});

showView("directory");

// ===== Firestore se volunteers padhna =====
let unsubscribeVolunteers = null;

function startVolunteerListener() {
    if (!window.fb || !window.currentUser) {
        return;
    }

    if (unsubscribeVolunteers) {
        unsubscribeVolunteers();
    }

    const volunteersRef = window.fb.collection(window.fb.db, "volunteers");

    unsubscribeVolunteers = window.fb.onSnapshot(volunteersRef, snapshot => {
        volunteers = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        displayVolunteers();
        updateLandingStats();
    }, error => {
        console.error("Firestore read error:", error);
        showToast("Could not load volunteers. Check the console.");
    });
}

window.addEventListener("authchange", () => {
    if (window.currentUser) {
        startVolunteerListener();
    } else if (unsubscribeVolunteers) {
        unsubscribeVolunteers();
        unsubscribeVolunteers = null;
    }
});

function updateLandingStats() {
    const landingVolunteers = document.getElementById("landingVolunteerCount");
    const landingAvailable = document.getElementById("landingAvailableCount");
    const landingRequests = document.getElementById("landingRequestCount");

    if (landingVolunteers) {
        landingVolunteers.textContent = volunteers.length;
    }
    if (landingAvailable) {
        landingAvailable.textContent = volunteers.filter(item => item.status === "Available").length;
    }
    if (landingRequests) {
        landingRequests.textContent = requests.length;
    }
}

window.addEventListener("authchange", () => {
    if (window.currentUser) {
        startRequestListener();
    } else if (requestsUnsubscribe) {
        requestsUnsubscribe();
        requestsUnsubscribe = null;
    }
});