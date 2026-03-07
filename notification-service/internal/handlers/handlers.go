package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/food-platform/notification-service/internal/models"
	"github.com/food-platform/notification-service/internal/service"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	svc service.NotificationService
}

func NewNotificationHandler(svc service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/notifications/user/:userId", h.ListByUser)
	rg.PATCH("/notifications/:id/read", h.MarkRead)
}

func (h *NotificationHandler) ListByUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("userId"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_user_id"})
		return
	}
	notifications, err := h.svc.ListByUser(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_server_error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "invalid_id"})
		return
	}
	if err := h.svc.MarkRead(uint(id)); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "notification_not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "internal_server_error"})
		return
	}
	c.JSON(http.StatusOK, models.SuccessResponse{Message: "marked_as_read"})
}

func (h *NotificationHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, models.HealthResponse{Service: "notification-service", Status: "ok"})
}
