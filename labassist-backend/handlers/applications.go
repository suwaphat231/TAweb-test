package handlers

import (
	"labassist/database"
	"labassist/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ApplyRequest is the request body for submitting an application
type ApplyRequest struct {
	CourseID    uint               `json:"course_id" binding:"required" example:"1"`
	RoleApplied models.RoleApplied `json:"role_applied" binding:"required" example:"ta"`
	Motivation  *string            `json:"motivation,omitempty" example:"ต้องการช่วยสอนนักศึกษา"`
}

// ReviewRequest is the request body for reviewing an application
type ReviewRequest struct {
	Status models.AppStatus `json:"status" binding:"required" example:"accepted"`
	Note   *string          `json:"note,omitempty" example:"ผ่านการคัดเลือก"`
}

// BulkReviewRequest is the request body for bulk reviewing applications
type BulkReviewRequest struct {
	ApplicationIDs []uint           `json:"application_ids" binding:"required"`
	Status         models.AppStatus `json:"status" binding:"required" example:"accepted"`
	Note           *string          `json:"note,omitempty"`
}

// UpdateProfileRequest is the request body for updating student profile
type UpdateProfileRequest struct {
	FullName *string `json:"full_name,omitempty" example:"สมชาย ใจดี"`
	Year     *int    `json:"year,omitempty" example:"3"`
	Faculty  *string `json:"faculty,omitempty" example:"วิทยาการคอมพิวเตอร์"`
}

type ApplicationHandler struct{}

func NewApplicationHandler() *ApplicationHandler { return &ApplicationHandler{} }

// StudentDashboard godoc
// @Summary      หน้าหลักนักศึกษา
// @Tags         student
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  StudentDashboardResponse
// @Router       /student/dashboard [get]
func (h *ApplicationHandler) StudentDashboard(c *gin.Context) {
	studentID, _ := c.Get("user_id")

	type AppRow struct {
		models.Application
		CourseCode  string `gorm:"column:course_code"`
		CourseTitle string `gorm:"column:course_title"`
	}

	var rows []AppRow
	database.DB.Table("applications a").
		Select("a.*, c.code AS course_code, c.title AS course_title").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("a.student_id = ?", studentID).
		Order("a.applied_at DESC").
		Limit(5).Scan(&rows)

	recentApps := make([]models.Application, len(rows))
	for i, r := range rows {
		recentApps[i] = r.Application
		recentApps[i].CourseCode = r.CourseCode
		recentApps[i].CourseTitle = r.CourseTitle
	}

	var recentCourses []models.Course
	database.DB.Table("courses c").
		Select("c.*, u.full_name AS instructor_name").
		Joins("JOIN users u ON u.id = c.instructor_id").
		Where("c.status IN ('open','closing_soon')").
		Order("c.created_at DESC").
		Limit(3).Scan(&recentCourses)

	var openCount int64
	database.DB.Model(&models.Course{}).Where("status IN ('open','closing_soon')").Count(&openCount)
	var appliedCount int64
	database.DB.Model(&models.Application{}).
		Where("student_id = ? AND status != 'withdrawn'", studentID).Count(&appliedCount)

	c.JSON(http.StatusOK, gin.H{
		"recent_applications": recentApps,
		"recent_courses":      recentCourses,
		"stats":               gin.H{"open_courses": openCount, "applied": appliedCount},
	})
}

// MyApplications godoc
// @Summary      รายการใบสมัครของนักศึกษา
// @Tags         student
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   models.Application
// @Router       /student/applications [get]
func (h *ApplicationHandler) MyApplications(c *gin.Context) {
	studentID, _ := c.Get("user_id")

	type AppRow struct {
		models.Application
		CourseCode   string `gorm:"column:course_code"`
		CourseTitle  string `gorm:"column:course_title"`
		ReviewerName string `gorm:"column:reviewer_name"`
	}

	var rows []AppRow
	database.DB.Table("applications a").
		Select("a.*, c.code AS course_code, c.title AS course_title, r.full_name AS reviewer_name").
		Joins("JOIN courses c ON c.id = a.course_id").
		Joins("LEFT JOIN users r ON r.id = a.reviewed_by_id").
		Where("a.student_id = ?", studentID).
		Order("a.applied_at DESC").Scan(&rows)

	apps := make([]models.Application, len(rows))
	for i, r := range rows {
		apps[i] = r.Application
		apps[i].CourseCode = r.CourseCode
		apps[i].CourseTitle = r.CourseTitle
		apps[i].ReviewedByName = r.ReviewerName
	}
	c.JSON(http.StatusOK, apps)
}

// Apply godoc
// @Summary      สมัครเป็น TA หรือ Lab Boy
// @Tags         student
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      ApplyRequest  true  "ข้อมูลการสมัคร"
// @Success      201   {object}  models.Application
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /student/applications [post]
func (h *ApplicationHandler) Apply(c *gin.Context) {
	studentID, _ := c.Get("user_id")
	var body struct {
		CourseID    uint               `json:"course_id" binding:"required"`
		RoleApplied models.RoleApplied `json:"role_applied" binding:"required"`
		Motivation  *string            `json:"motivation"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var course models.Course
	if err := database.DB.First(&course, body.CourseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}
	if course.Status == models.StatusClosed || course.Status == models.StatusDraft {
		c.JSON(http.StatusBadRequest, gin.H{"error": "course is not accepting applications"})
		return
	}

	// Check slot availability
	if body.RoleApplied == models.RoleTA && course.TAAccepted >= course.TASlots {
		c.JSON(http.StatusBadRequest, gin.H{"error": "TA slots are full"})
		return
	}
	if body.RoleApplied == models.RoleLabBoy && course.LabBoyAccepted >= course.LabBoySlots {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lab Boy slots are full"})
		return
	}

	app := models.Application{
		StudentID:   studentID.(uint),
		CourseID:    body.CourseID,
		RoleApplied: body.RoleApplied,
		Status:      models.AppAccepted,
		Motivation:  body.Motivation,
	}
	if err := database.DB.Create(&app).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "already applied"})
		return
	}

	// Increment accepted count
	field := "ta_accepted"
	if body.RoleApplied == models.RoleLabBoy {
		field = "labboy_accepted"
	}
	database.DB.Model(&models.Course{}).Where("id = ?", body.CourseID).
		UpdateColumn(field, gorm.Expr(field+" + 1"))

	c.JSON(http.StatusCreated, app)
}

// Withdraw godoc
// @Summary      ถอนใบสมัคร
// @Tags         student
// @Produce      json
// @Security     BearerAuth
// @Param        id  path  int  true  "Application ID"
// @Success      200  {object}  models.Application
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /student/applications/{id}/withdraw [put]
func (h *ApplicationHandler) Withdraw(c *gin.Context) {
	studentID, _ := c.Get("user_id")
	id, _ := strconv.Atoi(c.Param("id"))

	var app models.Application
	if err := database.DB.Where("id = ? AND student_id = ?", id, studentID).First(&app).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}
	if app.Status == models.AppWithdrawn {
		c.JSON(http.StatusBadRequest, gin.H{"error": "already withdrawn"})
		return
	}

	prevStatus := app.Status
	database.DB.Model(&app).Update("status", models.AppWithdrawn)

	// Decrement slot count if was accepted
	if prevStatus == models.AppAccepted {
		field := "ta_accepted"
		if app.RoleApplied == models.RoleLabBoy {
			field = "labboy_accepted"
		}
		database.DB.Model(&models.Course{}).Where("id = ?", app.CourseID).
			UpdateColumn(field, gorm.Expr(field+" - 1"))
	}

	c.JSON(http.StatusOK, app)
}

// GetProfile godoc
// @Summary      ดูโปรไฟล์นักศึกษา
// @Tags         student
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  models.User
// @Router       /student/profile [get]
func (h *ApplicationHandler) GetProfile(c *gin.Context) {
	studentID, _ := c.Get("user_id")
	var user models.User
	database.DB.First(&user, studentID)
	c.JSON(http.StatusOK, user)
}

// UpdateProfile godoc
// @Summary      แก้ไขโปรไฟล์นักศึกษา
// @Tags         student
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      UpdateProfileRequest  true  "ข้อมูลโปรไฟล์ที่ต้องการแก้ไข"
// @Success      200   {object}  models.User
// @Router       /student/profile [put]
func (h *ApplicationHandler) UpdateProfile(c *gin.Context) {
	studentID, _ := c.Get("user_id")
	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	allowed := map[string]interface{}{}
	for _, k := range []string{"full_name", "year", "faculty"} {
		if v, ok := body[k]; ok {
			allowed[k] = v
		}
	}

	var user models.User
	database.DB.First(&user, studentID)
	if len(allowed) > 0 {
		database.DB.Model(&user).Updates(allowed)
	}
	c.JSON(http.StatusOK, user)
}

// Review godoc
// @Summary      ตรวจสอบใบสมัคร (อาจารย์/สตาฟ/แอดมิน)
// @Tags         instructor
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path  int            true  "Application ID"
// @Param        body  body  ReviewRequest  true  "ผลการตรวจสอบ"
// @Success      200   {object}  models.Application
// @Failure      400   {object}  ErrorResponse
// @Failure      403   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /instructor/applications/{id}/review [put]
func (h *ApplicationHandler) Review(c *gin.Context) {
	reviewerID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	id, _ := strconv.Atoi(c.Param("id"))

	var body struct {
		Status models.AppStatus `json:"status" binding:"required"`
		Note   *string          `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var app models.Application
	if err := database.DB.Preload("Course").First(&app, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}
	if role.(string) == "instructor" {
		var course models.Course
		database.DB.First(&course, app.CourseID)
		rid := reviewerID.(uint)
		if course.InstructorID != rid {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
	}

	prevStatus := app.Status
	now := time.Now()
	rid := reviewerID.(uint)
	database.DB.Model(&app).Updates(map[string]interface{}{
		"status":         body.Status,
		"reviewed_at":    now,
		"reviewed_by_id": rid,
		"note":           body.Note,
	})

	// Manage accepted count
	field := "ta_accepted"
	if app.RoleApplied == models.RoleLabBoy {
		field = "labboy_accepted"
	}
	if body.Status == models.AppAccepted && prevStatus != models.AppAccepted {
		var course models.Course
		database.DB.First(&course, app.CourseID)
		if field == "ta_accepted" && course.TAAccepted >= course.TASlots {
			c.JSON(http.StatusBadRequest, gin.H{"error": "TA slots are full"})
			return
		}
		if field == "labboy_accepted" && course.LabBoyAccepted >= course.LabBoySlots {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Lab Boy slots are full"})
			return
		}
		database.DB.Model(&models.Course{}).Where("id = ?", app.CourseID).
			UpdateColumn(field, gorm.Expr(field+" + 1"))
	} else if prevStatus == models.AppAccepted && body.Status != models.AppAccepted {
		database.DB.Model(&models.Course{}).Where("id = ?", app.CourseID).
			UpdateColumn(field, gorm.Expr(field+" - 1"))
	}

	c.JSON(http.StatusOK, app)
}

// BulkReview godoc
// @Summary      ตรวจสอบใบสมัครแบบกลุ่ม
// @Tags         instructor
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      BulkReviewRequest  true  "รายการใบสมัครและผลการตรวจสอบ"
// @Success      200   {object}  BulkReviewResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /instructor/applications/bulk-review [put]
func (h *ApplicationHandler) BulkReview(c *gin.Context) {
	reviewerID, _ := c.Get("user_id")
	var body struct {
		ApplicationIDs []uint           `json:"application_ids" binding:"required"`
		Status         models.AppStatus `json:"status" binding:"required"`
		Note           *string          `json:"note"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	rid := reviewerID.(uint)
	result := database.DB.Model(&models.Application{}).
		Where("id IN ?", body.ApplicationIDs).
		Updates(map[string]interface{}{
			"status": body.Status, "reviewed_at": now, "reviewed_by_id": rid, "note": body.Note,
		})
	c.JSON(http.StatusOK, gin.H{"updated": result.RowsAffected})
}
