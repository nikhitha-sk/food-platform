package models

import "time"

// Notification represents a row in the notifications table.
type Notification struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	EventType string    `gorm:"type:varchar(100);not null" json:"event_type"`
	Title     string    `gorm:"type:varchar(255);not null" json:"title"`
	Body      string    `gorm:"type:text;not null" json:"body"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"created_at"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

type HealthResponse struct {
	Service string `json:"service"`
	Status  string `json:"status"`
}
