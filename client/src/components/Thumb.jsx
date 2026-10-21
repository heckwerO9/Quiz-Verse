import { useState } from 'react';
import { API } from '../api';

export default function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const url = src ? (src.startsWith('/') ? `${API}${src}` : src) : null;

  if (!url || failed) {
    return (
      <div className="thumb thumb-fallback" role="img" aria-label={alt ? `${alt} cover` : 'Quiz cover'}>
        <span aria-hidden="true">📝</span>
      </div>
    );
  }
  return <img className="thumb" src={url} alt={alt || ''} onError={() => setFailed(true)} />;
}
