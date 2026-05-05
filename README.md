# TaskFlow - Team Task Manager

A full-stack project and task management application designed for team collaboration. Features include role-based access control, interactive project dashboards, real-time team chat, and AI-powered task breakdowns.

## 🚀 Features
* **Role-Based Workspaces:** Admin and Member views to restrict task assignment and project creation.
* **Project Management:** Group tasks by project and track completion percentages.
* **Interactive Chat:** Global team chat window and isolated project-specific update feeds.
* **AI Integration:** Automatic task breakdowns via RabbitMQ and Celery background workers.

## 💻 Tech Stack
* **Frontend:** React.js, Tailwind CSS concepts
* **Backend:** FastAPI (Python), SQLAlchemy
* **Database:** PostgreSQL
* **Task Queue:** Celery, RabbitMQ

## 🛠️ Requirements
* Python 3.9+
* Node.js 16+
* PostgreSQL (Local or Hosted)
* RabbitMQ (Optional — for Celery AI worker)

## ⚙️ Local Setup

### 1. Database Setup
Ensure PostgreSQL is running and create a database named `taskflow_db`. 

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and start the server:
```bash
cd backend
pip install -r team-task-manager_backend_requirements.txt

# Set your database connection string
export DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow_db" # Linux/Mac
set DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow_db"    # Windows CMD

uvicorn main:app --reload