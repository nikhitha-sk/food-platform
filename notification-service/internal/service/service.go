package service

import (
	"errors"

	"github.com/food-platform/notification-service/internal/models"
	"github.com/food-platform/notification-service/internal/repository"
)

var (
	ErrNotFound = errors.New("not found")
)

type NotificationService interface {
	CreateNotification(userID uint, eventType, title, body string) (*models.Notification, error)
	ListByUser(userID uint) ([]models.Notification, error)
	MarkRead(id uint) error
}

type notificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) CreateNotification(userID uint, eventType, title, body string) (*models.Notification, error) {
	n := &models.Notification{
		UserID:    userID,
		EventType: eventType,
		Title:     title,
		Body:      body,
	}
	if err := s.repo.Create(n); err != nil {
		return nil, err
	}
	return n, nil
}

func (s *notificationService) ListByUser(userID uint) ([]models.Notification, error) {
	return s.repo.ListByUser(userID)
}

func (s *notificationService) MarkRead(id uint) error {
	n, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if n == nil {
		return ErrNotFound
	}
	return s.repo.MarkRead(id)
}
