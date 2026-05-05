from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class Role(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True)
    name            = Column(String, nullable=True)
    hashed_password = Column(String)
    role            = Column(Enum(Role), default=Role.MEMBER)
    tasks           = relationship("Task", back_populates="assignee")

class Project(Base):
    __tablename__ = "projects"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, index=True)
    description = Column(String, nullable=True)
    tasks       = relationship("Task", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, index=True)
    description = Column(String, nullable=True)
    status      = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    due_date    = Column(DateTime, nullable=True)
    project_id  = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ai_insights = Column(String, nullable=True)
    project     = relationship("Project", back_populates="tasks")
    assignee    = relationship("User", back_populates="tasks")


class ProjectComment(Base):
    __tablename__ = "project_comments"
    id          = Column(Integer, primary_key=True, index=True)
    text        = Column(String)
    timestamp   = Column(DateTime, default=datetime.utcnow)
    project_id  = Column(Integer, ForeignKey("projects.id"))
    user_id     = Column(Integer, ForeignKey("users.id"))
    
    project     = relationship("Project")
    user        = relationship("User")

class TeamMessage(Base):
    __tablename__ = "team_messages"
    id          = Column(Integer, primary_key=True, index=True)
    text        = Column(String)
    timestamp   = Column(DateTime, default=datetime.utcnow)
    user_id     = Column(Integer, ForeignKey("users.id"))
    
    user        = relationship("User")