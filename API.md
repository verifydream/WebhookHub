# API Documentation

## Webhook Endpoints

### Receive Webhook
`POST /api/w/:hubId` or `GET /api/w/:hubId`
Receives webhooks for the specified hub and stores the event.
Captures JSON, Form-data, text bodies, as well as headers and method.
Returns `{ received: true, event_id: number }`.

## Hub Endpoints

### Create Hub
`POST /api/hubs`
Creates a new hub.
**Body:** `{ "name": "Hub Name (optional)" }`
**Returns:** Hub object with `id`, `name`, `secret`.

### Get Hub Info
`GET /api/hubs/:id`
Retrieves information about a specific hub.
**Returns:** Hub object or 404 if not found.

### List Events for Hub
`GET /api/hubs/:id/events`
Retrieves the most recent events captured for a specific hub (up to 50).
**Returns:** Array of Event objects.

### Auto-Generated Docs
`GET /api/hubs/:id/docs`
Retrieves markdown documentation automatically generated based on the captured payloads.
**Returns:** Markdown text.

## Event Endpoints

### List Comments for Event
`GET /api/events/:id/comments`
Retrieves comments for a specific webhook event.
**Returns:** Array of Comment objects.

### Add Comment to Event
`POST /api/events/:id/comments`
Adds a comment to a specific webhook event.
**Body:** `{ "author": "User Name", "content": "Comment text" }`
**Returns:** Created Comment object.

### List Hubs
`GET /api/hubs`
Retrieves a list of all hubs.
**Returns:** Array of Hub objects.

### Delete Hub
`DELETE /api/hubs/:id`
Deletes a specific hub.
**Returns:** `{ "deleted": true }` or 404 if not found.
