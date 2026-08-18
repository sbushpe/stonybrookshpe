"""Business logic: eligibility, roles, attendance rules.

Services know nothing about HTTP (no Request/Response objects) and nothing about
SQL. They call the data layer and return plain objects or raise ApiError.
Empty until the auth slice lands. See engineering-rules.md §4.2.
"""
