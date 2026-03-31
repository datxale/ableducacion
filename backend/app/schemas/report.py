from typing import List, Optional

from pydantic import BaseModel


class ReportStudentItem(BaseModel):
    student_id: int
    student_name: str
    completion_rate: float
    pending_activities: int
    graded_submissions: int
    attendance_count: int


class ReportSubjectItem(BaseModel):
    subject_id: int
    subject_name: str
    activities: int
    live_classes: int
    submissions_pending_grading: int


class ReportOverviewResponse(BaseModel):
    total_students: int
    total_activities: int
    total_tasks_and_exams: int
    total_live_classes: int
    total_attendance_records: int
    pending_grading: int
    unread_notifications: int
    average_completion_rate: float
    top_students: List[ReportStudentItem]
    students_needing_attention: List[ReportStudentItem]
    subject_summary: List[ReportSubjectItem]
    grade_name: Optional[str] = None
