const SUPABASE_URL = "https://utcsratghqeadxboauhu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8mhcy9BGU2bimmWeoZztMw_UzjfUm7N";
let rsvpsCache = [];

function readRsvps() {
    return rsvpsCache;
}

async function loadRsvps() {
    try {
        const response = await supabaseRequest("rsvps?select=id,name,attending,guests,comment,created_at&order=created_at.asc");
        rsvpsCache = response.map((rsvp) => ({
            ...rsvp,
            createdAt: rsvp.created_at
        }));
        updateAttendeeSummary();
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function supabaseRequest(path, options = {}) {
    if (SUPABASE_URL.startsWith("PASTE_") || SUPABASE_ANON_KEY.startsWith("PASTE_")) {
        throw new Error("Supabase configuration is missing.");
    }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
    if (!response.ok) {
        let details = "";
        try {
            const errorBody = await response.json();
            details = errorBody.message || errorBody.error || "";
        } catch (error) {
            details = "";
        }
        throw new Error(details || `Supabase request failed: ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
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
                created_at: rsvp.createdAt
            })
        });
        if (!await loadRsvps()) {
            throw new Error("The RSVP was saved, but the shared counter could not be refreshed.");
        }
    } catch (error) {
        console.error(error);
        alert(`The RSVP could not be saved: ${error.message}`);
        return;
    }

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
        count.innerText = getAttendeeCount(readRsvps());
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
