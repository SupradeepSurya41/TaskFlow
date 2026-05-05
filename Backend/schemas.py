from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import enum

class Role(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

class UserCreate(BaseModel):
    name: Optional[str] = None      # ← added: full name from signup form
    email: str
    password: str
    role: Role = Role.MEMBER

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: Role
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectOut(ProjectCreate):
    id: int
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    project_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    ai_insights: Optional[str] = None
    assignee_id: Optional[int] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: str
    ai_insights: Optional[str] = None
    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    text: str
    user_id: int

class CommentOut(BaseModel):
    id: int
    text: str
    timestamp: datetime
    project_id: int
    user_id: int
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    text: str
    user_id: int

class MessageOut(BaseModel):
    id: int
    text: str
    timestamp: datetime
    user_id: int
    class Config:
        from_attributes = True