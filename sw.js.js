// Configurazione URL del file licenze su GitHub Raw
const GITHUB_LICENSES_URL = "https://raw.githubusercontent.com/TUO_UTENTE/TUO_REPOSITORY/main/licenses.json";

async function verifyLicenseOnline() {
    const userLicenseKey = localStorage.getItem("license_key");
    const deviceId = getDeviceId(); // La tua funzione che genera/recupera l'ID dispositivo locale

    if (!userLicenseKey) {
        showActivationModal("Inserisci il codice di licenza per attivare l'applicazione.");
        return false;
    }

    try {
        // 1. Recupera l'ora ufficiale da internet per evitare trucchi con la data del PC/telefono
        let now = new Date();
        try {
            const timeResponse = await fetch("https://worldtimeapi.org/api/ip");
            if (timeResponse.ok) {
                const timeData = await timeResponse.json();
                now = new Date(timeData.datetime);
            }
        } catch (e) {
            console.warn("Impossibile verificare l'ora di rete, si utilizza l'ora locale del dispositivo.");
        }

        // 2. Scarica il file delle licenze da GitHub
        const response = await fetch(GITHUB_LICENSES_URL + "?t=" + new Date().getTime()); // Parametro 't' per evitare il caching del browser
        if (!response.ok) throw new Error("Impossibile contattare il server delle licenze.");

        const licensesData = await response.json();
        const licenseInfo = licensesData[userLicenseKey];

        // 3. Verifica la validità della licenza
        if (!licenseInfo) {
            showActivationModal("Licenza non trovata o non valida.");
            return false;
        }

        if (!licenseInfo.active) {
            showActivationModal("Questa licenza è stata disattivata.");
            return false;
        }

        if (licenseInfo.deviceId && licenseInfo.deviceId !== deviceId) {
            showActivationModal("Questa licenza è associata ad un altro dispositivo.");
            return false;
        }

        const expiryDate = new Date(licenseInfo.expiryDate + "T23:59:59");
        if (now > expiryDate) {
            showActivationModal("La tua licenza è scaduta il " + licenseInfo.expiryDate + ". Rinnovala per continuare.");
            return false;
        }

        // Licenza OK: Sblocca l'interfaccia
        hideActivationModal();
        return true;

    } catch (error) {
        console.error("Errore verifica licenza:", error);
        // In caso di mancanza di connessione internet, puoi decidere se bloccare o consentire un accesso offline temporaneo
        alert("Errore durante la verifica della licenza online. Assicurati di essere connesso a internet.");
        return false;
    }
}

// Esegui la verifica all'avvio dell'applicazione
document.addEventListener("DOMContentLoaded", () => {
    verifyLicenseOnline();
});