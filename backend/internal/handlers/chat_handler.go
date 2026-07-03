package handlers

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"

	"github.com/vatilize-labs/lumo-finance/internal/ai"
	"github.com/vatilize-labs/lumo-finance/internal/ai/pending"
	"github.com/vatilize-labs/lumo-finance/internal/audit"
	"github.com/vatilize-labs/lumo-finance/internal/services"
)

type ChatHandler struct {
	chatService *ai.ChatService
}

func NewChatHandler(chatService *ai.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

type chatRequest struct {
	Message        string `json:"message" validate:"required,max=4000"`
	ConversationID string `json:"conversation_id"`
}

func (handler *ChatHandler) Chat(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var request chatRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	chatResult, err := handler.chatService.HandleChatMessage(
		c.Context(), userID, request.ConversationID, request.Message, audit.RequestInfoFromFiber(c))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	return c.JSON(chatResult)
}

// ChatStream is the SSE variant. The request body and auth are identical to
// Chat; the response is a text/event-stream of text_delta / tool_activity /
// pending_action / done / error events.
func (handler *ChatHandler) ChatStream(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var request chatRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	requestInfo := audit.RequestInfoFromFiber(c)

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	// The stream writer runs after this handler returns, so it must not
	// touch the fiber context — everything it needs is captured here.
	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(streamWriter *bufio.Writer) {
		emit := func(eventName string, payload interface{}) {
			payloadJSON, err := json.Marshal(payload)
			if err != nil {
				return
			}
			// Write errors mean the client disconnected; nothing to do but stop emitting.
			_, _ = fmt.Fprintf(streamWriter, "event: %s\ndata: %s\n\n", eventName, payloadJSON)
			_ = streamWriter.Flush()
		}
		handler.chatService.HandleChatMessageStream(
			context.Background(), userID, request.ConversationID, request.Message, requestInfo, emit)
	}))
	return nil
}

type confirmRequest struct {
	ActionID string `json:"action_id" validate:"required"`
	Pin      string `json:"pin" validate:"required"`
}

func (handler *ChatHandler) Confirm(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var request confirmRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	confirmResult, err := handler.chatService.ConfirmPendingAction(
		c.Context(), userID, request.ActionID, request.Pin, audit.RequestInfoFromFiber(c))
	if err != nil {
		switch {
		case errors.Is(err, ai.ErrPinIncorrect):
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		case errors.Is(err, ai.ErrPinLocked):
			return fiber.NewError(fiber.StatusLocked, err.Error())
		case errors.Is(err, pending.ErrPendingActionNotFound):
			return fiber.NewError(fiber.StatusGone, err.Error())
		case errors.Is(err, services.ErrInsufficientBalance),
			errors.Is(err, services.ErrTransactionDeclined):
			return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
		}
		return err
	}
	return c.JSON(confirmResult)
}

type cancelRequest struct {
	ActionID string `json:"action_id" validate:"required"`
}

func (handler *ChatHandler) Cancel(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var request cancelRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := handler.chatService.CancelPendingAction(c.Context(), userID, request.ActionID, audit.RequestInfoFromFiber(c)); err != nil {
		if errors.Is(err, pending.ErrPendingActionNotFound) {
			return fiber.NewError(fiber.StatusGone, err.Error())
		}
		return err
	}
	return c.JSON(fiber.Map{"cancelled": true})
}
