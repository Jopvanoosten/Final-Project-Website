CREATE TABLE IF NOT EXISTS spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merk TEXT NOT NULL,
    locatie TEXT,
    datum TEXT,
    fotograaf TEXT NOT NULL,
    afbeelding_bestand TEXT NOT NULL,
    ai_omschrijving TEXT
);