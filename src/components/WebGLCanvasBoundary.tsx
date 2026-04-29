import React from 'react';

interface WebGLCanvasBoundaryProps extends React.PropsWithChildren {
  fallback?: React.ReactNode;
}

interface WebGLCanvasBoundaryState {
  hasError: boolean;
}

export class WebGLCanvasBoundary extends React.Component<WebGLCanvasBoundaryProps, WebGLCanvasBoundaryState> {
  state: WebGLCanvasBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('WebGL canvas disabled after renderer error:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
