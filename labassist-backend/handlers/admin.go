package handlers

import (
	"labassist/database"
	"labassist/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// CreateUserRequest is the request body for creating a user
type CreateUserRequest struct {
	Username string          `json:"username" binding:"required" example:"johndoe"`
	Password string          `json:"password" binding:"required" example:"securepassword"`
	FullName string          `json:"full_name" binding:"required" example:"John Doe"`
	Email    string          `json:"email" binding:"required" example:"john@silpakorn.edu"`
	Role     models.UserRole `json:"role" binding:"required" example:"instructor"`
}

// UpdateUserStatusRequest is the request body for updating user active status
type UpdateUserStatusRequest struct {
	IsActive bool `json:"is_active" example:"true"`
}

// AdminStatsResponse is the response for admin stats endpoint
type AdminStatsResponse struct {
	TotalUsers           int64 `json:"total_users" example:"100"`
	TotalStudents        int64 `json:"total_students" example:"80"`
	TotalInstructors     int64 `json:"total_instructors" example:"10"`
	TotalCourses         int64 `json:"total_courses" example:"15"`
	OpenCourses          int64 `json:"open_courses" example:"5"`
	TotalApplications    int64 `json:"total_applications" example:"200"`
	AcceptedApplications int64 `json:"accepted_applications" example:"50"`
	PendingApplications  int64 `json:"pending_applications" example:"30"`
}

type AdminHandler struct{}

func NewAdminHandler() *AdminHandler { return &AdminHandler{} }

// Stats godoc
// @Summary      สถิติภาพรวมของระบบ
// @Tags         admin
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  AdminStatsResponse
// @Router       /admin/stats [get]
func (h *AdminHandler) Stats(c *gin.Context) {
	var stats struct {
		TotalUsers           int64 `json:"total_users"`
		TotalStudents        int64 `json:"total_students"`
		TotalInstructors     int64 `json:"total_instructors"`
		TotalCourses         int64 `json:"total_courses"`
		OpenCourses          int64 `json:"open_courses"`
		TotalApplications    int64 `json:"total_applications"`
		AcceptedApplications int64 `json:"accepted_applications"`
		PendingApplications  int64 `json:"pending_applications"`
	}
	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)
	database.DB.Model(&models.User{}).Where("role = 'student'").Count(&stats.TotalStudents)
	database.DB.Model(&models.User{}).Where("role = 'instructor'").Count(&stats.TotalInstructors)
	database.DB.Model(&models.Course{}).Count(&stats.TotalCourses)
	database.DB.Model(&models.Course{}).Where("status = 'open' OR status = 'closing_soon'").Count(&stats.OpenCourses)
	database.DB.Model(&models.Application{}).Count(&stats.TotalApplications)
	database.DB.Model(&models.Application{}).Where("status = 'accepted'").Count(&stats.AcceptedApplications)
	database.DB.Model(&models.Application{}).Where("status = 'pending'").Count(&stats.PendingApplications)
	c.JSON(http.StatusOK, stats)
}

// Users godoc
// @Summary      รายการผู้ใช้ทั้งหมด
// @Tags         admin
// @Produce      json
// @Security     BearerAuth
// @Param        role    query  string  false  "กรองตาม role" Enums(student, instructor, staff, admin)
// @Param        search  query  string  false  "ค้นหาด้วยชื่อหรืออีเมล"
// @Param        limit   query  int     false  "จำนวนต่อหน้า (default 100)"
// @Param        offset  query  int     false  "ออฟเซ็ต (default 0)"
// @Success      200     {array}   models.User
// @Router       /admin/users [get]
func (h *AdminHandler) Users(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	role   := c.Query("role")
	search := c.Query("search")

	if limit < 1 || limit > 200 { limit = 100 }

	q := database.DB.Order("created_at DESC")
	if role != "" { q = q.Where("role = ?", role) }
	if search != "" { q = q.Where("full_name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%") }

	var users []models.User
	q.Limit(limit).Offset(offset).Find(&users)
	c.JSON(http.StatusOK, users)
}

// CreateUser godoc
// @Summary      สร้างผู้ใช้ใหม่
// @Tags         admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      CreateUserRequest  true  "ข้อมูลผู้ใช้"
// @Success      201   {object}  models.User
// @Failure      400   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /admin/users [post]
func (h *AdminHandler) CreateUser(c *gin.Context) {
	var body struct {
		Username string          `json:"username" binding:"required"`
		Password string          `json:"password" binding:"required"`
		FullName string          `json:"full_name" binding:"required"`
		Email    string          `json:"email" binding:"required"`
		Role     models.UserRole `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "hash error"})
		return
	}
	ph := string(hash)
	user := models.User{
		Username:     &body.Username,
		PasswordHash: &ph,
		FullName:     body.FullName,
		Email:        body.Email,
		Role:         body.Role,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username or email already exists"})
		return
	}
	c.JSON(http.StatusCreated, user)
}

// UpdateUserStatus godoc
// @Summary      อัพเดตสถานะผู้ใช้ (เปิด/ปิด)
// @Tags         admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  int                      true  "User ID"
// @Param        body  body  UpdateUserStatusRequest  true  "สถานะใหม่"
// @Success      200   {object}  models.User
// @Failure      404   {object}  ErrorResponse
// @Router       /admin/users/{id}/status [put]
func (h *AdminHandler) UpdateUserStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var body struct{ IsActive bool `json:"is_active"` }
	c.ShouldBindJSON(&body)
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	database.DB.Model(&user).Update("is_active", body.IsActive)
	c.JSON(http.StatusOK, user)
}

// Logs godoc
// @Summary      ดู activity log
// @Tags         admin
// @Produce      json
// @Security     BearerAuth
// @Param        user_id  query  int     false  "กรองตาม user ID"
// @Param        method   query  string  false  "กรองตาม HTTP method" Enums(GET, POST, PUT, DELETE)
// @Param        page     query  int     false  "หน้า (default 1)"
// @Param        limit    query  int     false  "จำนวนต่อหน้า (default 50)"
// @Success      200      {object}  LogsResponse
// @Router       /admin/logs [get]
func (h *AdminHandler) Logs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	offset := (page - 1) * limit

	var total int64
	q := database.DB.Model(&models.ActivityLog{})
	if userID := c.Query("user_id"); userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	if method := c.Query("method"); method != "" {
		q = q.Where("method = ?", method)
	}
	q.Count(&total)

	var logs []models.ActivityLog
	q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs)

	c.JSON(http.StatusOK, gin.H{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
