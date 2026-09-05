# Demo Script — Reflex

A tight walkthrough of the core workflow, in the order it should be
presented live. Every step below has been tested and confirmed working
against the real API and database.

## Setup before the demo starts

1. MySQL/MariaDB running, `reflex_db` created, schema + seed data loaded.
2. `server/.env` configured with the `reflex_app` database user.
3. API running: `cd server && npm start` — confirm
   `http://localhost:3000/api/health` shows `"database":"connected"`.
4. Have the retailer, dispatcher, and rider pages open in separate
   browser tabs (or terminal windows if demoing the API directly).

## The walkthrough

**1. Retailer logs a delivery request**
Open the retailer page. Fill in a customer name, phone, address, and
item. Submit.
*Talking point:* this is the single entry point that replaces the
WhatsApp/phone-call coordination described in the problem statement.

**2. Dispatcher sees it appear as an open request**
Switch to the dispatcher view. The new request should be visible,
unassigned, with status `REQUESTED`.
*Talking point:* dispatchers get a live queue instead of scrolling
through chat history to find what's outstanding.

**3. Dispatcher assigns it to a rider**
Pick a rider from the list, assign. Status moves to `ASSIGNED`.
*Talking point:* mention the duplicate-assignment protection here even
without triggering it live — "if another dispatcher tried to assign this
same delivery right now, the system would reject it with a 409, not
silently create a conflict."

**4. Rider sees the assignment and updates status**
Switch to the rider view. The assignment should appear. Update status to
`PICKED_UP`, then `DELIVERED`.
*Talking point:* the system enforces the correct order — a rider cannot
jump straight from `ASSIGNED` to `DELIVERED` skipping `PICKED_UP`, and
cannot move status backward. This is worth demonstrating live if time
allows, since it's a strong, concrete answer to an "edge cases" question.

**5. Show the full history**
Pull up the delivery's history — every status change with a timestamp
and who made it.
*Talking point:* this is the "proof of delivery" record the problem
statement specifically asked for — something WhatsApp coordination never
provided.

## If asked to show an edge case live

Two fast, reliable ones to have ready:
- Try to assign an already-assigned delivery → shows the `409` rejection.
- Try to move a delivered item's status again → shows the `403`
  rejection.

Both were verified working in `docs/TESTING_EVIDENCE.md` and take
seconds to demonstrate.

## Timing target

Aim for 3-4 minutes for this walkthrough within the 10-minute
presentation slot, leaving room for the problem/architecture/trade-offs
framing around it.
