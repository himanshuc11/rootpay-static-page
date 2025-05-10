interface EventPayload {
    status: string;
    message?: string;
}

/**
 * Publishes events to the parent window/iframe
 * @param event - Event payload containing type and optional data
 * @param targetOrigin - Target origin for postMessage (e.g., 'https://example.com')
 */
export const publishEvent = (event: EventPayload, targetOrigin: string): void => {
    if (!window.parent) {
        console.warn('No parent window found');
        return;
    }

    try {
        window.parent.postMessage(event, targetOrigin);
    } catch (error) {
        console.error('Failed to publish event:', error);
    }
};

/**
 * Example usage:
 * publishEvent({ type: 'PAYMENT_SUCCESS', data: { transactionId: '123' } }, 'https://parentapp.com');
 */