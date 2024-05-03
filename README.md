# Educational Chatbot for FYP

This project is an educational chatbot developed as part of a Final Year Project (FYP). It aims to provide an interactive learning environment where students can engage in conversations to enhance their understanding ob biology for the 10th grade. The project includes a Flask API backend and a React frontend.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- Python 3.10.12
- pip 24.0
- Node.js v20.10.0
- npm 10.2.3

## Installation

### Backend Setup

1. Clone the repository to your local machine. (HTTPS: https://github.com/RayanFrem/fyp2.git or SSH: git@github.com:RayanFrem/fyp2.git)
2. Navigate to the cloned repository.
3. Set up a virtual environment:
   python -m venv venv
4. Activate the virtual environment

On Windows:
.\venv\Scripts\activate
On Unix or MacOS:
source venv/bin/activate

5. Install the required Python packages

pip install -r requirements.txt

6. create an .env file at the roote directory and put your Google API Key in variable 
### Frontend Setup

Ensure you are in the root directory of the project.
Install the necessary Node.js packages:

npm install

Running the Application
To get the application up and running, follow these steps:

Open a terminal and navigate to the project root directory.
Start the Flask backend:

flask run
Open another terminal and navigate to the project root directory.
Start the React frontend:

npm start

To start Chroma DB, use:

chroma run

Accessing the Application
The main interface of the chatbot is available when the React app runs at http://localhost:3000.
Admin dashboard and detailed context features can be accessed at http://localhost:3000/full.


