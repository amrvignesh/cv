const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const checkHealth = async () => {
    try {
        const response = await fetch(`${API_URL}/health`);
        return await response.json();
    } catch (error) {
        console.error('Health check failed:', error);
        return { status: 'error', message: 'Backend unreachable' };
    }
};
