package audit

import "github.com/gofiber/fiber/v2"

// RequestInfo carries the request attributes services need for audit
// records without depending on fiber themselves.
type RequestInfo struct {
	IPAddress string
	UserAgent string
}

func RequestInfoFromFiber(c *fiber.Ctx) RequestInfo {
	return RequestInfo{
		IPAddress: c.IP(),
		UserAgent: c.Get("User-Agent"),
	}
}
