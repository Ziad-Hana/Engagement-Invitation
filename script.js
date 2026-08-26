let rsvpsCache = [];

function getDeviceId() {
    let deviceId = localStorage.getItem("ziadHanaDeviceId");
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("ziadHanaDeviceId", deviceId);
    }
    return deviceId;
}

async function loadRsvps() {
    rsvpsCache = JSON.parse(localStorage.getItem("ziadHanaRsvp") || "[]");
    updateAttendeeSummary();
    return true;
}

function getAttendeeCount(rsvps) {
    return rsvps
        .filter((rsvp) => rsvp.attending === "yes")
        .reduce((total, rsvp) => total + Number(rsvp.guests || 0), 0);
}

async function saveRsvp(attending) {
    const box = document.getElementById(attending === "yes" ? "yesBox" : "noBox");
    const nameInput = box?.querySelector("input");

    if (!box || !nameInput || !nameInput.value.trim()) {
        alert("Please enter your name first.");
        nameInput?.focus();
        return;
    }

    const rsvp = {
        name: nameInput.value.trim(),
        attending,
        guests: attending === "yes" ? Number(document.getElementById("guestNumber")?.innerText || 1) : 0,
        comment: box.querySelector("textarea")?.value.trim() || "",
        createdAt: new Date().toISOString()
    };

    try {
        await supabaseRequest("rsvps", {
            method: "POST",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({
                name: rsvp.name,
                attending: rsvp.attending,
                guests: rsvp.guests,
                comment: rsvp.comment,
                created_at: rsvp.createdAt,
                device_id: getDeviceId()
            })
        });
    } catch (error) {
        console.error(error);
        return;
    }

    localStorage.setItem("ziadHanaRsvp", JSON.stringify([rsvp]));
    await loadRsvps();

    nameInput.value = "";
    const commentInput = box.querySelector("textarea");
    if (commentInput) {
        commentInput.value = "";
    }
    alert(attending === "yes" ? "Your attendance was saved. Thank you!" : "Thank you for letting us know.");
    updateAttendeeSummary();
}

function updateAttendeeSummary() {
    const count = document.getElementById("attendeeCount");
    if (count) {
        count.innerText = getAttendeeCount(rsvpsCache);
    }
}

function updateMusicButton() {
    const music = document.getElementById("bgMusic");
    const musicToggle = document.getElementById("musicToggle");
    if (!music || !musicToggle) {
        return;
    }

    const isPlaying = !music.paused;
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    musicToggle.querySelector("span").innerText = isPlaying ? "🔊" : "🔇";
    musicToggle.title = isPlaying ? "Pause music" : "Play music";
}

function startMusic() {
    const music = document.getElementById("bgMusic");
    if (!music) {
        return;
    }

    if (music.readyState === 0) {
        music.load();
    }
    const playback = music.play();
    playback?.catch(() => updateMusicButton());
}

function pauseMusic() {
    const music = document.getElementById("bgMusic");
    if (!music) {
        return;
    }
    music.pause();
    updateMusicButton();
}

window.addEventListener("DOMContentLoaded", () => {
    loadRsvps();

    const music = document.getElementById("bgMusic");
    const musicToggle = document.getElementById("musicToggle");
    updateMusicButton();
    music?.addEventListener("play", updateMusicButton);
    music?.addEventListener("pause", updateMusicButton);
    music?.addEventListener("ended", updateMusicButton);
    music?.addEventListener("volumechange", updateMusicButton);
    musicToggle?.addEventListener("click", async () => {
        if (!music || !music.paused) {
            pauseMusic();
            return;
        }

        startMusic();
    });
    document.getElementById("yesSubmit")?.addEventListener("click", () => saveRsvp("yes"));
    document.getElementById("noSubmit")?.addEventListener("click", () => saveRsvp("no"));
});
