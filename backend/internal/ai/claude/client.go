package claude

import (
	"context"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/anthropics/anthropic-sdk-go/packages/ssestream"
)

const maxResponseTokens = 2048

// MessagesClient is the narrow surface the chat service needs from the
// Anthropic SDK, so tests can substitute a fake and no other package
// imports the SDK directly.
type MessagesClient interface {
	CreateMessage(ctx context.Context, conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) (*anthropic.Message, error)
	StreamMessage(ctx context.Context, conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) *ssestream.Stream[anthropic.MessageStreamEventUnion]
}

type Client struct {
	anthropicClient anthropic.Client
	model           anthropic.Model
}

func NewClient(apiKey string, model string) *Client {
	return &Client{
		anthropicClient: anthropic.NewClient(option.WithAPIKey(apiKey)),
		model:           anthropic.Model(model),
	}
}

func (client *Client) buildParams(conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) anthropic.MessageNewParams {
	// Note: newer Claude models reject non-default temperature/top_p and
	// thinking budgets — only the required params are set here.
	return anthropic.MessageNewParams{
		Model:     client.model,
		MaxTokens: maxResponseTokens,
		System:    []anthropic.TextBlockParam{{Text: LumoSystemPrompt}},
		Messages:  conversationMessages,
		Tools:     tools,
	}
}

func (client *Client) CreateMessage(ctx context.Context, conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) (*anthropic.Message, error) {
	return client.anthropicClient.Messages.New(ctx, client.buildParams(conversationMessages, tools))
}

func (client *Client) StreamMessage(ctx context.Context, conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) *ssestream.Stream[anthropic.MessageStreamEventUnion] {
	return client.anthropicClient.Messages.NewStreaming(ctx, client.buildParams(conversationMessages, tools))
}
