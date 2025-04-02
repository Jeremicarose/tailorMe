'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material';

// Define a Client interface
interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    measurements?: {
        chest?: number;
        waist?: number;
        hips?: number;
    };
}

const ClientManagement: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Simulated fetch of clients (replace with actual API call)
    useEffect(() => {
        const fetchClients = async () => {
            // TODO: Replace with actual API endpoint
            const mockClients: Client[] = [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '123-456-7890',
                    measurements: { chest: 40, waist: 34, hips: 42}
                },
                { 
                    id: '2', 
                    name: 'Jane Smith', 
                    email: 'jane@example.com', 
                    phone: '987-654-3210' 
                  }
            ];
            setClients(mockClients);
        };

        fetchClients();
    }, []);

    const handleViewDetails = (client: Client) => {
        setSelectedClient(client);
        setIsDetailsOpen(true);
    };
    
    const HandleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedClient(null);
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Client Management
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.email}</TableCell>
                                <TableCell>{client.phone}</TableCell>
                                <TableCell>
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      onClick={() => handleViewDetails(client)}
                                      >
                                        View Details
                                      </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export default function Page() {
    return <ClientManagement />;
}