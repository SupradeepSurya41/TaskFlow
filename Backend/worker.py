from celery import Celery
import os

# Connects to RabbitMQ
celery_app = Celery("tasks", broker=os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//"))

@celery_app.task
def process_ai_task_breakdown(task_id: int, description: str):
    print(f"Processing AI breakdown for Task {task_id}: {description}")
    # Mocking OpenAI response for setup to prevent missing API key errors
    ai_suggestion = "- Setup initial structures\n- Write unit tests\n- Deploy\n- Priority: HIGH"

    from database import SessionLocal
    import models

    db = SessionLocal()
    try:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if task:
            task.ai_insights = ai_suggestion
            db.commit()
    finally:
        db.close()
