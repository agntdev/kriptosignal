# Crypto Tracker — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

Telegram bot for personal cryptocurrency tracking with customizable price alerts, watchlists, and optional morning summaries. Users manage private coin lists, set threshold and percent-change alerts, and receive notifications. The owner gets aggregated anonymous usage statistics.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- cryptocurrency enthusiasts
- individual investors
- Telegram users

## Success criteria

- users can add/remove coins to their watchlist
- price alerts trigger notifications based on user-defined thresholds
- morning summaries are delivered to opted-in users
- owner can view aggregated statistics via /stats command

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu and explain features
- **/price** (command, actor: user, command: /price) — Check price of a specific coin or all tracked coins
- **/watchlist** (command, actor: user, command: /watchlist) — View current watchlist of coins
- **/stats** (command, actor: owner, command: /stats) — View aggregated metrics for all users
- **Add to watchlist** (button, actor: user, callback: watchlist:add) — Add a new coin to the watchlist
  - inputs: ticker symbol
  - outputs: confirmation message
- **Set alert** (button, actor: user, callback: alert:create) — Create a new price or percent-change alert
  - inputs: ticker, alert type, parameters
  - outputs: confirmation message
- **Configure alerts** (button, actor: user, callback: alert:configure) — Manage existing alerts for a coin
  - inputs: ticker
  - outputs: alert configuration interface
- **Enable morning summary** (button, actor: user, callback: summary:enable) — Turn on daily price summary
  - inputs: preferred time
  - outputs: confirmation message
- **Set quiet hours** (button, actor: user, callback: quiet:configure) — Define notification suppression intervals
  - inputs: start time, end time
  - outputs: confirmation message

## Flows

### onboarding
_Trigger:_ /start

1. display welcome message
2. offer to add seed tickers
3. prompt for initial watchlist selection

_Data touched:_ User

### watchlist management
_Trigger:_ watchlist:add

1. select coin from predefined list
2. enter custom ticker
3. confirm addition to watchlist

_Data touched:_ Watchlist item

### alert creation
_Trigger:_ alert:create

1. select coin
2. choose alert type
3. set parameters
4. confirm alert creation

_Data touched:_ Price alert

### price check
_Trigger:_ /price

1. display specific coin price
2. show all tracked coin prices

_Data touched:_ Watchlist item

### morning summary
_Trigger:_ scheduled daily

1. compile 24h price changes
2. filter by threshold
3. deliver summary message

_Data touched:_ Notification record

### alert triggering
_Trigger:_ price update

1. check all active alerts
2. evaluate threshold/percent conditions
3. send notification if conditions met

_Data touched:_ Price alert, Notification record

### quiet hours management
_Trigger:_ quiet:configure

1. set start/end times
2. confirm quiet hours schedule

_Data touched:_ User

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — Telegram user with preferences and settings
  - fields: Telegram ID, timezone, quiet-hours intervals, morning summary time, preferences
- **Watchlist item** _(retention: persistent)_ — Coin being tracked by a user
  - fields: ticker, friendly name, enabled alerts
- **Price alert** _(retention: persistent)_ — User-defined price or percent-change alert
  - fields: direction, target price, percent, lookback window, cooldown period, step threshold
- **Notification record** _(retention: persistent)_ — Record of a sent alert notification
  - fields: timestamp, user, ticker, alert type, old price, new price, percent change

## Integrations

- **Telegram** (required) — Bot API messaging
- **Price feed** (required) — Cryptocurrency price data
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /stats command to view aggregated metrics

## Notifications

- Direct Telegram messages for price alerts
- Morning summary messages
- Error notifications for failed price fetches

## Permissions & privacy

- All user data is private and only accessible to the user and owner-aggregates
- No personal data shared with third parties
- Anonymized aggregated metrics for owner statistics

## Edge cases

- Failed price feed with retry logic
- User enters invalid ticker symbol
- Alert conditions met during quiet hours
- Multiple alert triggers within cooldown period
- User disables all alerts for a coin

## Required tests

- Verify alert triggering based on price thresholds
- Test morning summary delivery at scheduled time
- Validate quiet hours suppression of notifications
- Confirm error handling for failed price fetches
- Test watchlist management with valid and invalid tickers

## Assumptions

- Price feed is reliable with retry logic
- Users understand cryptocurrency ticker symbols
- Default alert parameters are sufficient for most users
- Telegram API is available and stable
