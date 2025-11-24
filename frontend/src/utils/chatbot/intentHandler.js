/**
 * Intent Handler for NeighbourBot
 * Recognizes user intents and extracts entities from messages
 */

class IntentHandler {
  constructor(intents) {
    this.intents = intents || [];
  }

  /**
   * Normalize text for matching
   */
  normalizeText(text) {
    return text.toLowerCase().trim();
  }

  /**
   * Check if message matches any trigger phrases
   */
  matchIntent(message) {
    const normalized = this.normalizeText(message);
    
    for (const intent of this.intents) {
      for (const trigger of intent.triggers || []) {
        if (normalized.includes(this.normalizeText(trigger))) {
          return intent;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract entities from message based on intent
   */
  extractEntities(message, intent) {
    const entities = {};
    const normalized = message.toLowerCase();

    // Extract content for post/alert creation
    if (intent.name === 'create_post' || intent.name === 'create_alert') {
      const colonIndex = message.indexOf(':');
      if (colonIndex !== -1) {
        entities.content = message.substring(colonIndex + 1).trim();
      } else {
        // Try to extract after trigger words
        for (const trigger of intent.triggers) {
          const triggerLower = trigger.toLowerCase();
          if (normalized.includes(triggerLower)) {
            const startIndex = normalized.indexOf(triggerLower) + triggerLower.length;
            entities.content = message.substring(startIndex).trim();
            break;
          }
        }
      }
    }

    // Extract post_id and comment for commenting
    if (intent.name === 'comment_on_post') {
      const postIdMatch = message.match(/post\s+(\w+)/i) || message.match(/#(\w+)/);
      if (postIdMatch) {
        entities.post_id = postIdMatch[1];
      }
      
      const commentMatch = message.match(/comment[:\s]+(.+)/i) || message.match(/reply[:\s]+(.+)/i);
      if (commentMatch) {
        entities.comment = commentMatch[1].trim();
      }
    }

    // Extract query for search
    if (intent.name === 'search_marketplace' || intent.name === 'search_businesses') {
      const searchMatch = message.match(/(?:search|find|look for)\s+(.+)/i);
      if (searchMatch) {
        entities.query = searchMatch[1].trim();
      } else {
        // Extract after trigger
        for (const trigger of intent.triggers) {
          const triggerLower = trigger.toLowerCase();
          if (normalized.includes(triggerLower)) {
            const startIndex = normalized.indexOf(triggerLower) + triggerLower.length;
            entities.query = message.substring(startIndex).trim();
            break;
          }
        }
      }
    }

    // Extract title and price for marketplace items
    if (intent.name === 'create_market_item') {
      const priceMatch = message.match(/for\s+[R$]?(\d+(?:\.\d+)?)/i) || message.match(/price[:\s]+[R$]?(\d+(?:\.\d+)?)/i);
      if (priceMatch) {
        entities.price = parseFloat(priceMatch[1]);
      }
      
      // Extract title (everything before "for" or price)
      const forIndex = normalized.indexOf(' for ');
      const priceIndex = normalized.search(/price[:\s]/i);
      const cutIndex = forIndex !== -1 ? forIndex : (priceIndex !== -1 ? priceIndex : message.length);
      
      const titlePart = message.substring(0, cutIndex);
      const titleMatch = titlePart.match(/(?:list|sell|item)[:\s]+(.+)/i);
      if (titleMatch) {
        entities.title = titleMatch[1].trim();
      }
    }

    // Extract neighbourhood_id for update
    if (intent.name === 'update_neighbourhood') {
      const idMatch = message.match(/neighbourhood[:\s]+(\w+)/i) || message.match(/location[:\s]+(\w+)/i);
      if (idMatch) {
        entities.neighbourhood_id = idMatch[1];
      }
    }

    return entities;
  }

  /**
   * Check if required entities are present
   */
  validateEntities(entities, intent) {
    if (!intent.entities_required) {
      return { valid: true, missing: [] };
    }

    const missing = intent.entities_required.filter(
      (required) => !entities[required] || entities[required] === ''
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Process message and return intent with entities
   */
  processMessage(message) {
    const intent = this.matchIntent(message);
    
    if (!intent) {
      return { intent: null, entities: {} };
    }

    const entities = this.extractEntities(message, intent);
    const validation = this.validateEntities(entities, intent);

    return {
      intent,
      entities,
      validation,
    };
  }
}

export default IntentHandler;

