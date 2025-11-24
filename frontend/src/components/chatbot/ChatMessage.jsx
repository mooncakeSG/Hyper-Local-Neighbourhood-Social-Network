import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, role, timestamp, metadata }) => {
  const isUser = role === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">
        {message}
        {metadata?.suggestions && (
          <div className="suggestions">
            {metadata.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-button"
                onClick={() => metadata.onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {metadata?.data && (
          <div className="message-data">
            {renderData(metadata.data, metadata.dataType)}
          </div>
        )}
      </div>
      {timestamp && (
        <div className="message-timestamp">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

const renderData = (data, dataType) => {
  if (!data) return null;

  switch (dataType) {
    case 'posts':
      return (
        <div className="posts-list">
          {Array.isArray(data) && data.length > 0 ? (
            data.slice(0, 5).map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <strong>{post.user?.name || 'Anonymous'}</strong>
                  {post.type === 'alert' && <span className="alert-badge">Alert</span>}
                </div>
                <div className="post-content">{post.content}</div>
                <div className="post-meta">
                  {post.comments_count > 0 && `${post.comments_count} comments`}
                  {post.likes_count > 0 && ` • ${post.likes_count} likes`}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No posts found</div>
          )}
        </div>
      );

    case 'marketplace':
      return (
        <div className="marketplace-list">
          {Array.isArray(data) && data.length > 0 ? (
            data.slice(0, 5).map((item) => (
              <div key={item.id} className="marketplace-item">
                <div className="item-title">{item.title}</div>
                <div className="item-price">R{item.price}</div>
                <div className="item-status">{item.status}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">No items found</div>
          )}
        </div>
      );

    case 'businesses':
      return (
        <div className="businesses-list">
          {Array.isArray(data) && data.length > 0 ? (
            data.slice(0, 5).map((business) => (
              <div key={business.id} className="business-item">
                <div className="business-name">{business.name}</div>
                <div className="business-category">{business.category}</div>
                {business.contact_phone && (
                  <div className="business-contact">{business.contact_phone}</div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">No businesses found</div>
          )}
        </div>
      );

    default:
      return <div className="data-display">{JSON.stringify(data, null, 2)}</div>;
  }
};

export default ChatMessage;

