package handlers

import "labassist/models"

// ErrorResponse is returned when an error occurs
type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

// MessageResponse is returned for simple success messages
type MessageResponse struct {
	Message string `json:"message" example:"ออกจากระบบแล้ว"`
}

// DashboardStats contains student dashboard summary counts
type DashboardStats struct {
	OpenCourses int64 `json:"open_courses" example:"5"`
	Applied     int64 `json:"applied" example:"2"`
}

// StudentDashboardResponse is the full student dashboard payload
type StudentDashboardResponse struct {
	RecentApplications []models.Application `json:"recent_applications"`
	RecentCourses      []models.Course      `json:"recent_courses"`
	Stats              DashboardStats       `json:"stats"`
}

// BulkReviewResponse is returned after bulk review
type BulkReviewResponse struct {
	Updated int64 `json:"updated" example:"3"`
}

// LogsResponse is the paginated activity log response
type LogsResponse struct {
	Data  []models.ActivityLog `json:"data"`
	Total int64                `json:"total" example:"100"`
	Page  int                  `json:"page" example:"1"`
	Limit int                  `json:"limit" example:"50"`
}
