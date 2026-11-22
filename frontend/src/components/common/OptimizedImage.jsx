import React, { useState } from 'react'

/**
 * Responsive WebP image with tiny base64 LQIP blur-up placeholder,
 * explicit dimensions for zero CLS, and priority/lazy loading controls.
 */
export default function OptimizedImage({
  imageSet = null,
  src = '',
  alt = '',
  sizes = '100vw',
  width,
  height,
  priority = false,
  className = '',
  wrapperClassName = '',
  draggable = true,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)

  const resolvedSrc = imageSet?.src || src
  const resolvedSrcSet = imageSet?.srcSet || undefined
  const resolvedLqip = imageSet?.lqip || ''
  const resolvedWidth = width || imageSet?.width
  const resolvedHeight = height || imageSet?.height

  return (
    <span
      className={`relative block overflow-hidden ${wrapperClassName}`}
      style={
        resolvedLqip && !loaded
          ? {
              backgroundImage: `url(${resolvedLqip})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }
          : undefined
      }
    >
      <img
        src={resolvedSrc}
        srcSet={resolvedSrcSet}
        sizes={resolvedSrcSet ? sizes : undefined}
        alt={alt}
        width={resolvedWidth}
        height={resolvedHeight}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        draggable={draggable}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-500 ${
          loaded || priority ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...rest}
      />
    </span>
  )
}

