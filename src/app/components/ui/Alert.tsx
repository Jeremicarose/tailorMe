import React from 'react'

interface AlertProps {
    variant: 'success' | 'error' | 'warning' | 'info';
    children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ variant, children }) => {
    const variantStyles = {
        success: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
    };

    return (
        <div className={`p-4 rounded-md ${variantStyles[variant]}`}>
            {children}
        </div>
    );
};

export default Alert;