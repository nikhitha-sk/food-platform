package repository

import (
	"errors"

	"github.com/food-platform/notification-service/internal/models"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(n *models.Notification) error
	ListByUser(userID uint) ([]models.Notification, error)
	GetByID(id uint) (*models.Notification, error)
	MarkRead(id uint) error
}

type notificationRepo struct{ db *gorm.DB }

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepo{db: db}
}

func (r *notificationRepo) Create(n *models.Notification) error {
	return r.db.Create(n).Error
}

func (r *notificationRepo) ListByUser(userID uint) ([]models.Notification, error) {
	var list []models.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *notificationRepo) GetByID(id uint) (*models.Notification, error) {
	var n models.Notification
	err := r.db.First(&n, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &n, err
}

func (r *notificationRepo) MarkRead(id uint) error {
	return r.db.Model(&models.Notification{}).Where("id = ?", id).Update("is_read", true).Error
}
