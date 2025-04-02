import React from 'react';

interface AlertDescriptionProps {
    children: React. ReactNode;
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children }) => {
    return (
        <p className = "mt-2 text-sm">
            {children}
        </p>
    );
};

export default AlertDescription;