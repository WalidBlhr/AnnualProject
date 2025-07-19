import {Alert, Container, Snackbar, Typography} from "@mui/material";
import { useState } from "react";

interface AdminPageProps{
  title: string;
  alert: Alert;
  setAlert: React.Dispatch<React.SetStateAction<Alert>>;
  children: React.ReactNode;
}

export interface Alert{
  open: boolean;
  message: string;
  severity: "success" | "error";
}

const AdminPage : React.FC<AdminPageProps> = ({title, alert, setAlert, children}) => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>

      {children}

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({...alert, open: false})}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({...alert, open: false})}
          sx={{whiteSpace: 'pre-line'}}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPage;