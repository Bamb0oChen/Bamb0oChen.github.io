import { Component } from 'react';

// Works in both the DOM and R3F trees; each caller supplies the correct fallback.
export default class ModelErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.warn(`[ModelViewer] ${this.props.label || '3D content'} unavailable; using fallback.`, error);
    }

    render() {
        return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
    }
}
