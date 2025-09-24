# Reconnection State Management Features

This document describes the new reconnection state management features added to resolve [issue #178](https://github.com/elpheria/rpc-websockets/issues/178).

## Problem

Previously, users had no way to determine when the last reconnection attempt had failed. The `close` event provided no information about whether reconnects would be attempted, and the properties that could be used to determine reconnection state (`reconnect_timer_id` and `current_reconnects`) were private.

## Solution

This implementation adds:

1. **New Event**: `max_reconnects_reached` - Fired when all reconnection attempts have been exhausted
2. **New Methods**: Public methods to programmatically check reconnection state

## New Event: `max_reconnects_reached`

This event is emitted when the client has exhausted all reconnection attempts and will not attempt to reconnect again.

**Event Parameters:**
- `code` (number): The WebSocket close code
- `reason` (string): The WebSocket close reason

**Example:**
```javascript
client.on('max_reconnects_reached', (code, reason) => {
    console.log('All reconnection attempts failed');
    console.log('Close code:', code);
    console.log('Close reason:', reason);
    
    // Handle permanent disconnection
    showPermanentDisconnectionMessage();
    disableRetryButton();
});
```

## New Methods

### `getCurrentReconnects()`

Returns the current number of reconnection attempts made.

**Returns:** `number` - Current reconnection attempt count

**Example:**
```javascript
const currentAttempts = client.getCurrentReconnects();
console.log(`Made ${currentAttempts} reconnection attempts so far`);
```

### `getMaxReconnects()`

Returns the maximum number of reconnection attempts configured.

**Returns:** `number` - Maximum reconnection attempts (0 means unlimited)

**Example:**
```javascript
const maxAttempts = client.getMaxReconnects();
if (maxAttempts === 0) {
    console.log('Unlimited reconnection attempts configured');
} else {
    console.log(`Maximum ${maxAttempts} reconnection attempts configured`);
}
```

### `isReconnecting()`

Checks if the client is currently in the process of attempting to reconnect.

**Returns:** `boolean` - `true` if a reconnection timer is active

**Example:**
```javascript
if (client.isReconnecting()) {
    showReconnectingSpinner();
} else {
    hideReconnectingSpinner();
}
```

### `willReconnect()`

Checks if the client will attempt to reconnect on the next connection failure.

**Returns:** `boolean` - `true` if reconnection will be attempted

**Example:**
```javascript
client.on('close', (code, reason) => {
    if (client.willReconnect()) {
        showMessage('Connection lost, attempting to reconnect...');
    } else {
        showMessage('Connection lost permanently');
    }
});
```

## Usage Patterns

### Basic Reconnection Status

```javascript
const client = new WebSocket('ws://example.com', {
    max_reconnects: 5,
    reconnect_interval: 1000
});

client.on('max_reconnects_reached', (code, reason) => {
    console.log('Connection permanently failed');
    // Update UI to show disconnected state
    updateConnectionStatus('disconnected');
});
```

### Progress Indicator

```javascript
client.on('error', (error) => {
    const current = client.getCurrentReconnects();
    const max = client.getMaxReconnects();
    
    if (client.willReconnect()) {
        updateProgressBar(current, max);
        showMessage(`Reconnecting... (${current}/${max})`);
    }
});

client.on('open', () => {
    hideProgressBar();
    showMessage('Connected');
});
```

### Retry Button Management

```javascript
const retryButton = document.getElementById('retry-button');

client.on('close', () => {
    if (!client.willReconnect()) {
        // Show manual retry option when auto-reconnect is exhausted
        retryButton.disabled = false;
        retryButton.textContent = 'Retry Connection';
    }
});

client.on('max_reconnects_reached', () => {
    retryButton.disabled = false;
    retryButton.onclick = () => {
        // Manual reconnection
        client.connect();
    };
});
```

### Connection Health Monitoring

```javascript
function getConnectionHealth() {
    return {
        isConnected: client.ready,
        isReconnecting: client.isReconnecting(),
        willReconnect: client.willReconnect(),
        currentAttempts: client.getCurrentReconnects(),
        maxAttempts: client.getMaxReconnects(),
        hasUnlimitedRetries: client.getMaxReconnects() === 0
    };
}

// Use in React/Vue components or health dashboards
setInterval(() => {
    const health = getConnectionHealth();
    updateHealthIndicator(health);
}, 1000);
```

## Backward Compatibility

These changes are fully backward compatible:

- No existing APIs were modified
- No existing behavior was changed
- The new event is only emitted when reconnection limits are reached
- The new methods are additive and don't affect existing functionality

## Configuration

The new features work with existing reconnection configuration:

```javascript
const client = new WebSocket('ws://example.com', {
    reconnect: true,          // Enable reconnection
    max_reconnects: 5,        // Maximum attempts (0 = unlimited)
    reconnect_interval: 1000  // Delay between attempts
});
```

When `max_reconnects` is set to 0 (unlimited), the `max_reconnects_reached` event will never be fired, and `willReconnect()` will always return `true` (assuming `reconnect` is `true`).