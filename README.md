![Synaptic AI Logo](https://raw.githubusercontent.com/nishantpanwar77/SynapticAI/refs/heads/master/synpt-ai-web/public/Frame.png)

# Synaptic AI

Synaptic AI is a locally installed large language model (LLM) platform with a sleek Angular v19 user interface. It enables private, on-device interaction with powerful language models without relying on cloud services, ensuring privacy, performance, and control.

## Features

- Local deployment of large language models
- Beautiful and responsive UI built with Angular v19
- No cloud dependency for data privacy and faster response times
- AI memory implemented
- Fully custom markdown parsers.

## Setup

To get started with Synaptic AI, follow these steps to create and activate a virtual environment, then install the required dependencies.

### Install Ollama
[➤ Download Ollama here](https://ollama.com/download/)

➤ Install model of your choice


### Linux / macOS  : *(bash)*

1. **Create a virtual environment**
```bash
python3 -m venv venv
OR
python -m venv venv
```

2. **Activate the virtual environment**

```bash
source venv/bin/activate
```
3. **Install dependencies**

```bash
pip install -r requirements.txt
```
4. **Run the backend Server**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```


### Windows : *(cmd)*

1. **Create a virtual environment**
```cmd
python -m venv venv
```

2. **Activate the virtual environment**
- In Command Prompt (cmd):
    ```cmd
    venv\Scripts\activate
    ```
- In PowerShell:
    ```cmd
    venv\Scripts\Activate.ps1
    ```
***Note: If you encounter an execution policy error, run the following command first, then try activating again***
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

3. **Install dependencies from requirements.txt**
```cmd
pip install -r requirements.txt
```

4. **Run the backend Server**
```cmd
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```


## Tech Stack

**Client:** Angular v19, Bootstrap

**Backend:** Python, FastAPI, Ollama, MongoDB, Vector DB

