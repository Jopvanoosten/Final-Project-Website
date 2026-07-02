import uuid  # Zorg dat je 'import uuid' bovenaan je main.py hebt staan
import os
import sqlite3
from flask import Flask, render_template, redirect, url_for, request, jsonify, g
from werkzeug.utils import secure_filename
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired
 
# send_file is niet direct nodig in deze routes, maar is een goede import
from flask import send_file
import smtplib
from email.message import EmailMessage
import requests

# Configuratie voor de Flask app
app = Flask(__name__)

# Een geheime sleutel is nodig voor Flask sessies en CSRF-beveiliging
# ECHTE APPLICATIES: Gebruik een sterke, willekeurige sleutel die niet hier hardcoded is.
app.config["SECRET_KEY"] = "een_zeer_geheime_en_sterke_sleutel_die_niemand_raadt" # Verander dit voor productie!
app.config["WTF_CSRF_ENABLED"] = False # Uitschakelen voor nu, maar in productie inschakelen en gebruiken!

# Map waar geüploade bestanden worden opgeslagen
# app.root_path is de basis van je Flask applicatie
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Toegestane bestandsextensies voor uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Zorg ervoor dat de uploadmap bestaat
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Functie om de database connectie te krijgen
def get_db_connection():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect('myDB.db')
        db.row_factory = sqlite3.Row # Zodat rijen als dictionaries benaderd kunnen worden
    return db

# Functie om de database te initialiseren
def init_db():
    with app.app_context():
        db = get_db_connection()
        with app.open_resource('schema.sql', mode='r') as f: # We maken een schema.sql bestand aan
            db.cursor().executescript(f.read())
        db.commit()

# Functie om de database connectie te sluiten aan het einde van de request
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Helper functie om te controleren of een extensie is toegestaan
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Routes voor de statische pagina's
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/spots')
def spots():
    return render_template('spots.html')

@app.route('/voegtoe')
def voegtoe():
    return render_template('voegtoe.html')

@app.route('/info')
def info():
    return render_template('info.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

# API Endpoints voor de auto spots
@app.route('/api/spots', methods=['GET', 'POST'])
def api_spots():
    db = get_db_connection()

    if request.method == 'POST':
        # Haal de gegevens op van het formulier (FormData)
        # BELANGRIJK: Naam 'merk' uit formulier moet 'merk' kolom in DB matchen
        merk = request.form.get('merk') # <<< Gebruik 'merk' als kolomnaam
        locatie = request.form.get('locatie')
        datum = request.form.get('datum')
        fotograaf = request.form.get('fotograaf')
        # ai_omschrijving is optioneel en komt niet in je huidige code voor in de POST data
        # Als je een AI omschrijving hebt, moet je die ook uit request.form halen
        ai_omschrijving = request.form.get('ai_omschrijving', '') # Voeg dit toe als je het veld in je formulier hebt


        # Controleer of alle verplichte velden zijn ingevuld
        # Pas dit aan op basis van welke velden in je HTML formulier verplicht zijn
        if not merk or not fotograaf: # Aangenomen dat merk en fotograaf verplicht zijn
            return jsonify({'message': 'Merk en fotograaf zijn verplichte velden.'}), 400

        # Verwerk de geüploade afbeelding
        afbeelding_bestand = None # Initialiseer met None of een default waarde
        if 'afbeelding' in request.files:
            file = request.files['afbeelding']

            if file.filename == '':
                # Geen bestand geselecteerd, maar veld was wel aanwezig
                return jsonify({'message': 'Geen geselecteerd bestand voor upload.'}), 400
            
            if file and allowed_file(file.filename):
                # Genereer een veilige bestandsnaam
                original_filename = secure_filename(file.filename)
                # Haal de extensie op
                file_extension = os.path.splitext(original_filename)[1]
                # Genereer een unieke string voor de prefix
                unique_prefix = str(uuid.uuid4().hex) # uuid.uuid4().hex is beter dan os.urandom().hex() voor unieke namen
                
                # De definitieve unieke bestandsnaam met extensie
                unique_filename = f"{unique_prefix}{file_extension}"
                
                # Constructie van het volledige pad waar het bestand wordt opgeslagen
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                # Sla het bestand op
                file.save(filepath)
                
                # DEZE bestandsnaam MOET WORDEN OPGESLAGEN IN DE DATABASE
                afbeelding_bestand = unique_filename
            else:
                return jsonify({'message': 'Ongeldig bestandstype voor afbeelding.'}), 400
        else:
            # Als het 'afbeelding' veld zelfs niet in de request.files zit (bijv. formulier heeft geen file input)
            return jsonify({'message': 'Afbeelding bestand niet gevonden in het verzoek.'}), 400

        try:
            db.execute(
                # Pas de kolomnamen hier aan om exact te matchen met je schema.sql
                # Aangenomen dat schema.sql kolommen heeft voor: merk, locatie, datum, fotograaf, afbeelding_bestand, ai_omschrijving
                'INSERT INTO spots (merk, locatie, datum, fotograaf, afbeelding_bestand, ai_omschrijving) VALUES (?, ?, ?, ?, ?, ?)',
                (merk, locatie, datum, fotograaf, afbeelding_bestand, ai_omschrijving) # Zorg dat de volgorde hier overeenkomt
            )
            db.commit()
            return jsonify({'message': 'Spot succesvol toegevoegd!'}), 201 # 201 Created
        except sqlite3.Error as e:
            app.logger.error(f"Database fout bij toevoegen spot: {e}")
            # Verwijder de geüploade file als de database-insert mislukt
            if afbeelding_bestand and os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'message': 'Fout bij opslaan in database.', 'error': str(e)}), 500

    elif request.method == 'GET':
        # Haal alle spots op uit de database
        try:
            cursor = db.execute('SELECT * FROM spots ORDER BY id DESC') # Nieuwste eerst
            spots_from_db = cursor.fetchall()
            
            # Converteer de rijen naar een lijst van dictionaries en voeg de volledige URL toe
            spots_list = []
            for spot_row in spots_from_db:
                spot_dict = dict(spot_row)
                # Genereer de volledige URL naar de afbeelding
                # Dit genereert /static/uploads/UNIEKE_FILENAME.EXTENSIE
                spot_dict['afbeelding_url'] = url_for('static', filename=f'uploads/{spot_dict["afbeelding_bestand"]}')
                spots_list.append(spot_dict)
            
            return jsonify(spots_list), 200
        except sqlite3.Error as e:
            app.logger.error(f"Database fout bij ophalen spots: {e}")
            return jsonify({'message': 'Fout bij ophalen spots uit database.', 'error': str(e)}), 500

@app.route('/api/contact', methods=['POST'])
def api_contact():
    data = request.get_json()
    naam = data.get('naam')
    email = data.get('email')
    categorie = data.get('categorie')
    bericht = data.get('bericht')

    if not (naam and email and bericht):
        return jsonify({'message': 'Naam, e-mail en bericht zijn verplicht.'}), 400

    # Gebruik Formspree om het formulier te versturen zonder SMTP
    formspree_url = 'https://formspree.io/f/xdoqzqzv'  # Vervang door jouw eigen Formspree endpoint indien gewenst
    payload = {
        'naam': naam,
        'email': email,
        'categorie': categorie or '-',
        'bericht': bericht
    }
    try:
        response = requests.post(formspree_url, data=payload, timeout=10)
        if response.status_code in (200, 201):
            return jsonify({'message': 'Bericht succesvol verzonden!'}), 200
        else:
            return jsonify({'message': 'Fout bij verzenden via Formspree.', 'error': response.text}), 500
    except Exception as e:
        app.logger.error(f"Fout bij verzenden via Formspree: {e}")
        return jsonify({'message': 'Fout bij verzenden e-mail.', 'error': str(e)}), 500

if __name__ == "__main__":
    # Initialiseer de database wanneer de applicatie start
    # Dit zorgt ervoor dat de 'spots' tabel wordt aangemaakt als deze nog niet bestaat
    init_db()
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug)
