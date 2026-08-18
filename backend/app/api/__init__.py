"""HTTP layer: parse and validate input, call a service, shape the response.

Route modules live directly under the version directory (app/api/v1/). This is the
"routes" layer of engineering-rules.md section 4.2 - it may call services, never the
data layer, and no business logic lives here.
"""
