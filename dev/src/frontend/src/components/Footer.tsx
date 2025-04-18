import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Footer: React.FC = () => {
    return (
        <AppBar position="static" color="primary">
            <Toolbar>
                <Typography variant="body1" color="inherit">
                    © {new Date().getFullYear()} Quartissimo
                </Typography>
            </Toolbar>
        </AppBar>
    );
};

export default Footer;