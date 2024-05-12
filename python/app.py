import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import chromadb
import fitz
import shutil
import uuid
import traceback
import mysql.connector
from mysql.connector import Error
import numpy as np
import faiss
from werkzeug.utils import secure_filename
import re
import json
import subprocess
from dotenv import load_dotenv

#loading env file
load_dotenv()

app = Flask(__name__)

#CORS setup
CORS(app)
CORS(app, resources={r"/api/": {"origins": ""}})

#Gemini and Sentence transformer setups
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)
model_embed = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
gemini_model = genai.GenerativeModel('gemini-pro')

#Whisper Setup
UPLOAD_FOLDER = '../public/tmp_audio'
ALLOWED_EXTENSIONS = {'mp3', 'wav'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

#Chroma DB setup
client = chromadb.HttpClient(host='localhost', port=8000)
collection_name = "embeddedColl"
collection = client.get_or_create_collection(name=collection_name)

script_directory = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(script_directory)
TREATED_DIR = os.path.join(BASE_DIR, 'data', 'treated')
UNTREATED_DIR = os.path.join(BASE_DIR, 'data', 'untreated')

# FAISS index and ID map setup
index_path = os.path.join(script_directory, 'index.faiss')
id_map_path = os.path.join(script_directory, 'id_map.json')

# FAISS index setup
def load_faiss_index(path=index_path):
    try:
        if os.path.exists(path) and os.path.getsize(path) > 0:
            return faiss.read_index(path)
        else:
            dimension = 384
            index_flat = faiss.IndexFlatL2(dimension)
            index = faiss.IndexIDMap(index_flat)
            faiss.write_index(index, path)
            return index
    except Exception as e:
        print(f"Error loading FAISS index: {e}")
        dimension = 384
        index_flat = faiss.IndexFlatL2(dimension)
        return faiss.IndexIDMap(index_flat)

# Save the index to disk
def save_index(index, filename=index_path):
    faiss.write_index(index, filename)

def load_id_map():
    try:
        with open(id_map_path, 'r') as f:
            data = f.read()  
            if data: 
                return json.loads(data)
            else:
                print("Warning: ID map file is empty, initializing new map")
                return {}
    except FileNotFoundError:
        print("ID map file not found, initializing new map")
        return {}
    except json.JSONDecodeError:
        print("Error decoding JSON, initializing new map")
        return {}

def save_id_map(id_map, path=id_map_path):
    try:
        if not id_map:
            print("Warning: Attempting to save an empty ID map.")
        with open(path, 'w') as f:
            json.dump(id_map, f)
        print(f"ID map saved successfully to {path} with {len(id_map)} entries")
    except Exception as e:
        print(f"Failed to save ID map: {e}")

id_map = load_id_map()
index = load_faiss_index()
# Utility to convert UUID string to an integer to create id mapping
def uuid_to_int(uuid_str):
    return int(uuid.UUID(uuid_str).int & ((1<<31)-1))

#Below are functions written to handle calls inside the app.py file 
def embed_sentence_private(sentence):
    embedding = model_embed.encode(sentence)
    return embedding.tolist()

def save_index(index, filename='/home/rayan/fyp2/python/index.faiss'):
    faiss.write_index(index, filename)

def search_similar_private(sentence):
    embedding = model_embed.encode(sentence)
    results = collection.search(embedding)
    return results

def list_pdf_files(directory):
    if os.path.exists(directory):
        return [f for f in os.listdir(directory) if f.endswith('.pdf')]
    return []

def chunk_pdf_text(pdf_path, chunk_size=800):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    return chunks

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def insert_into_faq(question, answer):
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='fyp2',
            user='rayan',
            password='qwertyUIOP@1205'
        )
        if connection.is_connected():
            db_cursor = connection.cursor()
            insert_query = """INSERT INTO faq (question, answer) VALUES (%s, %s)"""
            db_cursor.execute(insert_query, (question, answer))
            connection.commit()
            print("Successfully inserted the record into the faq table.")
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
    finally:
        if connection.is_connected():
            db_cursor.close()
            connection.close()
            print("MySQL connection is closed")
def remove_asterisks(text):
    list_text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    cleaned_text = re.sub(r'\*([^*]+)\*', r'\1', list_text)
    
    return cleaned_text

def allowed_file_ext(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'



#Below are the routes and functions for API calls
@app.route('/api/upload', methods=['POST'])
def upload():
    file = request.files.get('file')
    if file and allowed_file_ext(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join('../data/untreated', filename))
        return 'Fichier téléchargé avec succès', 200
    return 'Fichier invalide ou erreur de téléchargement', 400

@app.route('/get-gemini-answer', methods=['POST'])
def get_gemini_answer():     
    try:
        data = request.json
        prompt = data['prompt']
        full_conversation = data.get('fullConversation', [])

        query_embedding = model_embed.encode(prompt)
        query_embedding = np.array(query_embedding).astype('float32').reshape(1, -1)
        
        D, I = index.search(query_embedding, 5)
        id_map = load_id_map()
        
        uuids = [id_map.get(str(i), None) for i in I[0]]
        print(uuids)
        
        documents = []
        for uuid in uuids:
            if uuid:
                doc_data = collection.get(ids=[uuid])
                if doc_data and 'documents' in doc_data:
                    documents.extend(doc_data['documents'])
        
        context = " ".join(documents)
        
        if full_conversation:
            conversation_context = "\n".join([f"Q: {item['prompt']}\nA: {item['answer']}" for item in full_conversation])
            full_prompt = f"Voici la conversation complète:\n{conversation_context}\n\nCeci est la question actuelle: {prompt}\nVoici le contexte obtenu: {context}\nSur la base de ce contexte et de la conversation complète, veuillez fournir une réponse bien structurée en français:"
        else:
            full_prompt = f"Ceci est la question: {prompt}\nVoici le contexte obtenu: {context}\nSur la base de ce contexte, veuillez fournir une réponse bien structurée en français:"
        
        response = gemini_model.generate_content(full_prompt)
        cleaned_response = remove_asterisks(response.text)
        return jsonify({"answer": cleaned_response, "context": context})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



@app.route('/get-audio-transcription', methods=['POST'])
def get_audio_transcription():
    save_path = "../public/tmp_audio/tmp.mp3"
    command = ['whisper', save_path]
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        output = result.stdout
        
        transcription_start = output.find('Detected language: ') + len('Detected language: ')
        if transcription_start > len('Detected language: '):
            transcription_start = output.find('\n', transcription_start) + 1
        
        transcription = output[transcription_start:].strip()
        cleaned_transcription = re.sub(r'^\[.*?\]\s*', '', transcription, flags=re.MULTILINE)
        
        os.remove(save_path)
        return jsonify({"transcription": cleaned_transcription}), 200
    except subprocess.CalledProcessError as e:
        print("Error running Whisper:", e)
        os.remove(save_path)
        return jsonify({'error': "Erreur lors du traitement de l'audio avec Whisper"}), 500
    except Exception as e:
        print(f"An error occurred: {e}")
        os.remove(save_path)
        return jsonify({"error": "Une erreur s'est produite lors du traitement de votre demande"}), 500


@app.route('/get-gemini-suggestions', methods=['POST'])
def get_gemini_suggestions():
   data = request.json
   try:
       answer = data['answer']
       question = data['question']
       context = data['context']
   except Exception as e:
        question = data['question']
        answer = ""
        context = ""
   prompt = "La question en français est : " + str(question) + "Le bot a répondu :" + str(answer) + "Le contexte de cetter réponse :" + str(context) + " En se basant sur la question et cette réponse et le contexte fourni, suggérez trois questions courte (10 mots) de suivi en français, couvrant différents types de questions scientifique dont la réponse est dans le contexte donner. Donnez seulement les questions "
   suggested_questions = gemini_model.generate_content(prompt)
   suggested_questions = suggested_questions.text
   question1, question2, question3 = suggested_questions.split('\n')[:3]
   return jsonify(question1, question2, question3)

@app.route('/embed-sentence', methods=['POST'])
def embed_sentence():
    data = request.json
    sentence = data['sentence']
    embedding = model_embed.encode(sentence)
    return jsonify(embedding.tolist())

@app.route('/search-similar', methods=['POST'])
def search_similar():
    data = request.json
    sentence = data['sentence']
    embedding = model_embed.encode(sentence)
    results = collection.search(embedding)
    return jsonify(results)

@app.route('/view-indexed', methods=['GET'])
def view_indexed():
    try:
        all_data = collection.peek()
        if not all_data:
            return jsonify({"message": "Data is empty"}), 200
        return jsonify(all_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/treated-files', methods=['GET'])
def treated_files():
    files = list_pdf_files(TREATED_DIR)
    return jsonify(files)

@app.route('/untreated-files', methods=['GET'])
def untreated_files():
    files = list_pdf_files(UNTREATED_DIR)
    return jsonify(files)

@app.route('/treat-data', methods=['POST'])
def treat_data():
    id_map = load_id_map()
    index = load_faiss_index()
    if os.path.exists(index_path) and os.path.getsize(index_path) == 0:
        os.remove(index_path)
        print(f"Deleted empty index file: {index_path}")

    if not id_map:
        print("ID map is empty before saving.")
    else:
        print(f"ID map has {len(id_map)} entries before saving.")
    try:
        index = load_faiss_index() 
        id_map = load_id_map()

        for pdf in list_pdf_files(UNTREATED_DIR):
            pdf_path = os.path.join(UNTREATED_DIR, pdf)
            shutil.move(pdf_path, os.path.join(TREATED_DIR, pdf))
            pdf_path = os.path.join(TREATED_DIR, pdf)
            chunks = chunk_pdf_text(pdf_path, 800)
            embeddings = []
            documents = []
            ids = []
            np_ids = []

            for chunk in chunks:
                embedding = embed_sentence_private(chunk)
                uuid_str = str(uuid.uuid4())
                faiss_id = uuid_to_int(uuid_str)

                embeddings.append(embedding)
                documents.append(chunk)
                ids.append(uuid_str)
                np_ids.append(faiss_id)

                id_map[faiss_id] = uuid_str

            if documents and embeddings:
                collection.add(embeddings=embeddings, documents=documents, ids=ids)

            np_embeddings = np.array(embeddings, dtype='float32')
            np_ids_array = np.array(np_ids, dtype='int64')
            index.add_with_ids(np_embeddings, np_ids_array)

            shutil.move(pdf_path, os.path.join(TREATED_DIR, pdf))

        save_index(index)
        save_id_map(id_map)
        return jsonify("Les données insérées dans FAISS, ChromaDB et la carte d'identification ont été mises à jour avec succès")
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)})

    
@app.route('/fetch-faq', methods=['GET'])
def fetch_faq():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            database='fyp2',
            user='rayan',
            password='qwertyUIOP@1205'
        )
        if connection.is_connected():
            db_cursor = connection.cursor(dictionary=True)
            db_cursor.execute("SELECT * FROM faq LIMIT 10")
            faq_rows = db_cursor.fetchall()
            return jsonify(faq_rows)
    except Error as e:
        print(f"Error fetching FAQ data from MySQL: {e}")
        return jsonify({"error": "Failed to fetch FAQ data"}), 500
    finally:
        if connection.is_connected():
            db_cursor.close()
            connection.close()

@app.route('/api/saveAudio', methods=['POST'])
def save_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'message': 'Fichier enregistré avec succès'}), 200
    else:
        return jsonify({'error': 'Type de fichier non autorisé'}), 400

if __name__ == '_main_':
    untreated_dir = os.path.join(BASE_DIR, 'untreated')
    chunked_dir = os.path.join(BASE_DIR, 'chunked')
    app.run(debug=True, port=5000)